import { dsvFormat } from "d3-dsv";
import { Mongo } from "meteor/mongo";
import { Data, Assignments,EDFFile} from "/collections";

String.prototype.toPascalCase = function () {
	return this.replace(/\s(.)/g, function ($1) {
		return $1.toUpperCase();
	}).replace(/\s/g, "");
};




// This should stay Float32Array, as this is required for the use of
// WebAudio features for digital signal processing in the frontend,
// see https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer/copyToChannel
const FloatArrayType = Float32Array;

const exec = Npm.require("child_process").exec;
const runCommand = Meteor.wrapAsync(exec);

// runs a wfdb command in runInDirectory
const runWFDBCommand = (command, runInDirectory = "") => {
	//TODO: check this
	// console.time("runWFDBCommand");
	let WFDBCommand = command;
	const EDFDir = process.env.EDF_DIR + runInDirectory; // locates the EDF directory using the environment variables and runInDirectory
	if (EDFDir) {
		WFDBCommand = 'WFDB="' + EDFDir + '" ' + WFDBCommand;
	}
	//console.log("WFDBCommand:", WFDBCommand);
	const output = runCommand(WFDBCommand, {
		maxBuffer: 2048 * 500 * 10,
		cwd: EDFDir,
	});
	// console.timeEnd("runWFDBCommand");
	return output;
};

// checks if the user is assigned to the EDF file
const isAssignedToEDF = (userId, filePath) => {
	const dataIds = Data.find({ path: filePath }, { fields: { _id: 1 } })
		.fetch()
		.map((doc) => doc._id);
	const numAssignments = Assignments.find({
		users: userId,
		dataFiles: { $in: dataIds },
	}).count();
	return numAssignments > 0;
};

let WFDB = {
  wfdbdesc(recordingFilePath) {
    const isCallFromClient = !!this.connection; // checks if the function is called from the client
    if (
      isCallFromClient &&
      !isAssignedToEDF(Meteor.userId(), recordingFilePath) // checks if the user is assigned to the EDF file
    ) {
      throw new Meteor.Error(
        "wfdb.wfdbdesc.command.permission.denied",
        "You are not assigned to this recording. Permission denied."
      );
    }
    try {
      // gets the name and directory of the recording
      const recordingPathSegments = recordingFilePath.split("/");
      const recordingFilename =
        recordingPathSegments[recordingPathSegments.length - 1];
      delete recordingPathSegments[recordingPathSegments.length - 1];
      const recordingDirectory = recordingPathSegments.join("/");
      return runWFDBCommand(
        'wfdbdesc "' + recordingFilename + '"',
        recordingDirectory
      );
    } catch (e) {
      throw new Meteor.Error("wfdb.wfdbdesc.command.failed", e.message);
    }
  },

  //runs a wfdb command to get the data from the recording and returns it to getedf data
  rdsamp(options) {
    //console.log("rdsamp started");
    const isCallFromClient = !!this.connection;
    if (
      isCallFromClient &&
      !isAssignedToEDF(Meteor.userId(), options.recordingName)
    ) {
      //checks if the current user is authorized to access the recording
      //console.log("Access denied");
      throw new Meteor.Error(
        "wfdb.rdsamp.command.permission.denied",
        "You are not assigned to this recording. Permission denied."
      );
    }

    // console.time('rdsamp');
    try {
      // //console.log("try");

      // sets the setting to use high precision sampling if the option is set
      const useHighPrecisionSamplingString = options.useHighPrecisionSampling
        ? " -P"
        : " -p";

      // this segment gets the name of the recording file from the path and the path to the recording
      //console.log("options.recordingName:", options.recordingName);
      const recordingPathSegments = options.recordingName.split("/");
      const recordingFilename =
        recordingPathSegments[recordingPathSegments.length - 1];
      delete recordingPathSegments[recordingPathSegments.length - 1];
      const recordingDirectory = recordingPathSegments.join("/");

      // gets the the name of the file without the "data type" i.e MUSE,ANNE, etc
      let recordingFilenameWithoutDataType = recordingFilename.substring(
        0,
        recordingFilename.length - 4
      );
      
      //////////////////////////////////////////////////////////////////////////
      // Here we downsample the data
      recordingFilenameWithoutDataType =
        recordingFilenameWithoutDataType.replace(".", "_");
      const downsampledFileName =
        recordingFilenameWithoutDataType + "_downsampled";

      //creates a .dat file for the downsampled file
      const downsampledFile = downsampledFileName + ".dat";
      //creates a .hea (header) file for the downsampled file
      const downsampledHeaderFile = downsampledFileName + ".hea";

      // gets the recording id of the file we are working on from options
      const recordingId = options.recordingId;

      // the following line get all the channels from the metadata of the recording and display all of them
      // we should modify it to be only displaying the channel required in the particular montage
      const channelDisplayed = Data.findOne(
        recordingId
      ).metadata.wfdbdesc.Groups[0].Signals.reduce(
        (channels, signal) => channels + " '" + signal.Description + "'",
        "-s"
      );
      // console.log("channelDisplayed:", channelDisplayed);

      const channelsDisplayed = options.channelsDisplayed;

      let channelsDisplayedString = "-s";
      channelsDisplayed.forEach((channel) => {
        channelsDisplayedString += " " + channel;
      });
      

      // console.log("channelsDisplayedString:", channelsDisplayedString);
      //console.log('channel displayed', channelDisplayed);
      // this is the original version of codes which display all channels specified in the options:
      // const channelDisplayed = options.channelsDisplayed ? ' -s ' + options.channelsDisplayed.join(' ') : '';

      var signalRawOutput = null;
      if (!options.lowResolutionData) {
        // if the x-axis scale is less then 5 mins/page (+4 sec padded)
        // rdsamp the original high sampling rate .edf file
        signalRawOutput = runWFDBCommand(
          'rdsamp -r "' +
            recordingFilename +
            '" -f ' +
            options.startTime +
            " -l " +
            options.windowLength +
            useHighPrecisionSamplingString +
            " -c -H -v " +
            channelsDisplayedString,
          recordingDirectory
        );
      } else {
        let downsampledExists = runWFDBCommand(
          `test -f "${downsampledFile}" && test -f "${downsampledHeaderFile}" && echo "t" || echo "f"`,
          recordingDirectory
        ).replace(/\r?\n/, "");
        if (downsampledExists != "t") {
          throw new Meteor.Error(
            "wfdb.rdsamp.command.downsampled.file.missing",
            "The downsampled file .dat or its header file .hea is missing, please reload the page and try again later."
          );
        }
        // rdsamp the downsampled .dat file with lower sampling rate
        signalRawOutput = runWFDBCommand(
          'rdsamp -r "' +
            downsampledFileName +
            '" -f ' +
            options.startTime +
            " -l " +
            options.windowLength +
            useHighPrecisionSamplingString +
            " -c -H -v " +
            channelsDisplayedString,
          recordingDirectory
        );
      }

      // console.time('parseRawOutput');
      let rows = dsvFormat(",").parseRows(signalRawOutput);
      const columnNames = rows[0].map((value) => {
        return value.substr(1).slice(0, -1);
      });
      let channelNames = columnNames.slice(1);
      const index = channelNames.indexOf("EDF Annotations");
      // console.log(index);
      // if (index > -1) {
      // 	channelNames.splice(index, 1);
      // }
      // //console.log("rows[0]:", rows[0], "\ncolumnNames:", columnNames);

      rows.shift();
      const columnUnits = rows[0].map((value) => {
        return value.substr(1).slice(0, -1);
      });
      // console.log(rows);
      const channelUnits = columnUnits.slice(1);
      // //console.log("rows[0]:", rows[0], "\ncolumnUnits:", columnUnits);
      // console.log("\nchannelUnits", channelUnits);
      rows.shift();
      const numSamplesRaw = rows.length;
      const lastSampleIndex = numSamplesRaw - 1;
      const outputStartTimeInSeconds = parseFloat(rows[0][0]);
      const outputEndTimeInSeconds = parseFloat(rows[lastSampleIndex][0]);
      const outputDurationInSeconds =
        outputEndTimeInSeconds - outputStartTimeInSeconds;
      const samplingRateRaw = numSamplesRaw / outputDurationInSeconds;
      // console.log("220 samplingRateRaw: " + samplingRateRaw);
      // console.log("221 numSamplesRaw: " + numSamplesRaw);
      // console.log("222 outputStartTimeInSeconds: " + outputDurationInSeconds);

      //downsamples here
      let downSamplingFactor = 0;

      if (options.targetSamplingRate > 0) {
        // console.log("here")
        downSamplingFactor = Math.round(
          samplingRateRaw / options.targetSamplingRate
        );
      }
      if (downSamplingFactor > 1) {
        rows = rows.filter((row, r) => {
          return r % downSamplingFactor === 0;
        });
      }

      const numSamples = rows.length;
      const samplingRate = Math.round(numSamples / outputDurationInSeconds);
      // console.log("237 samplingRate : " + samplingRate); console.log("237 numSamples : " + numSamples); console.log("237 outputDurationInSeconds : " + outputDurationInSeconds);
      const data = channelNames.map(() => {
        return new FloatArrayType(numSamples);
      });
      rows.forEach((row, r) => {
        // ignore first column (elapsed time)
        row.shift();
        row.forEach((value, c) => {
          if (value === "-") {
            value = 0.0;
          } else {
            value = parseFloat(value);
          }
          data[c][r] = value;
        });
      });
      // Format of the data that we return
      let dataFrame = {
        channelNames: channelNames,
        data: data,
        startTime: outputStartTimeInSeconds,
        endTime: outputEndTimeInSeconds,
        duration: outputDurationInSeconds,
        numSamples: numSamples,
        samplingRate: samplingRate,
      };
      // console.timeEnd('parseRawOutput');
      // console.timeEnd('rdsamp');
      return dataFrame;
    } catch (e) {
      // console.timeEnd('rdsamp');
      if (
        e.message.split("\n")[1] !== undefined &&
        e.message.split("\n")[1].trim() == ""
      ) {
        // if output has no data
        const channelNames = options.channelsDisplayed.map((channelName) =>
          channelName.slice(1, -1)
        );
        const data = channelNames.map(() => {
          return new FloatArrayType(1);
        });
        return {
          channelNames: channelNames,
          data: data,
          numSamples: 0,
        };
      } else {
        throw new Meteor.Error("wfdb.rdsamp.command.failed", e.message);
      }
    }
  },
  downsamp(options) {
    // function that downsamples the data
    const isCallFromClient = !!this.connection;
    if (
      isCallFromClient &&
      !isAssignedToEDF(Meteor.userId(), options.recordingName)
    ) {
      // if the user is not assigned to the recording, throw an error
      throw new Meteor.Error(
        "wfdb.rdsamp.command.permission.denied",
        "You are not assigned to this recording. Permission denied."
      );
    }
    try {
      // get the name and direction of the recording
      const recordingPathSegments = options.recordingName.split("/");
      const recordingFilename =
        recordingPathSegments[recordingPathSegments.length - 1];
      delete recordingPathSegments[recordingPathSegments.length - 1];
      const recordingDirectory = recordingPathSegments.join("/");

      let recordingFilenameWithoutDataType = recordingFilename.substring(
        0,
        recordingFilename.length - 4
      );
      // having '.' inside the downsampling file name will cause error occured when executing xform function
      recordingFilenameWithoutDataType =
        recordingFilenameWithoutDataType.replace(".", "_");

      const downsampledFileName =
        recordingFilenameWithoutDataType + "_downsampled";
      const downsampledFile = downsampledFileName + ".dat";
      const downsampledHeaderFile = downsampledFileName + ".hea";
      //console.log('filenames:', downsampledFileName, downsampledFile, downsampledHeaderFile);

      // setup the low resolution file if it does not exist
      let downsampledExists = runWFDBCommand(
        `test -f "${downsampledFile}" && test -f "${downsampledHeaderFile}" && echo "t" || echo "f"`,
        recordingDirectory
      ).replace(/\r?\n/, "");
      //console.log(`downsampledExists: "${downsampledExists}"`);

      if (downsampledExists != "t") {
        // create a header file .hea (https://www.physionet.org/physiotools/wag/header-5.htm)
        // then downsample the recording using xform (https://www.physionet.org/physiotools/wag/xform-1.htm)
        // it will create downsampled file in mit format (.dat + .hea)

        let metadata = options.recordingMetadata;
        let headerFile = [];

        // set the sampling frequency to targetDownsamplingRate
        // and the number of samples per signal to zero to turn off the checksum verification
        let recordLine = [
          downsampledFileName,
          metadata.Groups[0].Signals.length,
          options.targetDownsamplingRate,
          0,
        ];
        let recordingTimeAndDate = metadata.StartingTime.slice(1, -1);
        recordLine.push(recordingTimeAndDate);
        headerFile.push(recordLine.join(" "));

        metadata.Groups[0].Signals.forEach((signal) => {
          let signalLine = [downsampledFile];
          signalLine.push(signal.StorageFormat.match(/[0-9.]+/)[0]);
          let adc = signal.Gain.replace(
            " adu",
            "(" + signal.Baseline + ")"
          ).match(/[\S]+/);
          signalLine.push(adc);
          signalLine.push(signal.ADCResolution.match(/[0-9.]+/)[0]);
          signalLine.push(signal.ADCZero);
          signalLine.push(signal.InitialValue);
          signalLine.push("0"); // set the checksum to 0 as a placeholder
          signalLine.push("0");
          signalLine.push(signal.Description);
          headerFile.push(signalLine.join(" "));
        });

        // write into the header file and perform xform to downsample
        const modifiedHeader = headerFile.join("\r\n");
        runWFDBCommand(
          `echo "${modifiedHeader}" > ${downsampledHeaderFile}`,
          recordingDirectory
        );
        runWFDBCommand(
          `xform -i "${recordingFilename}" -H -o "${downsampledHeaderFile}"`,
          recordingDirectory
        );
      }
    } catch (e) {
      if (
        e.message.split("\n")[1] !== undefined &&
        e.message.split("\n")[1].trim() == ""
      ) {
        return {
          numSamples: 0,
        };
      } else {
        throw new Meteor.Error("wfdb.downsamp.command.failed", e.stack);
      }
    }
  },
};

let isInteger = (expression) => {
  return expression == "" + parseInt(expression);
};
/*
let filterName = (allSignals) => {
  returnSignals = [];

  allSignals.forEach((fixSignal) => {
  if(fixSignal.){

  }
  });
  return returnSignals = [];

}
*/
let parseComputedChannelString = (computedChannelString, recordingId) => {
  //parses the channel string and return the data of channels
  const parts = computedChannelString.split("=");
  const channelName = parts[0].trim();
  let channelKey;
  let functionParameters;
  let functionName;
  if (parts.length > 1) {
    const formula = parts[1].trim();
    const formulaParts = formula.split("(");

    if (formulaParts.length == 1) {
      functionName = "IDENTITY";
      functionParameters = [{ name: formulaParts[0], dataId: recordingId }];
      channelKey = functionParameters[0].name;
    } else {
      functionName = formulaParts[0];
      functionParameters = formulaParts[1]
        .slice(0, -1)
        .split(",")
        .map((parameter) => {
          return { name: parameter.trim(), dataId: recordingId };
        });
      channelKey =
        functionName +
        "(" +
        functionParameters.map((parameter) => parameter.name).join(",") +
        ")";
    }

    let individualChannelsRequired;
    switch (functionName) {
      case "MEAN":
      case "IDENTITY":
        individualChannelsRequired = functionParameters;
        break;
      default:
        throw new Meteor.Error(
          "get.edf.data.computed.channel.unknown.function",
          "Unknown function name for computed channel: " + functionName
        );
        break;
    }
  } else {
    functionName = "IDENTITY";
    functionParameters = [{ name: channelName, dataId: recordingId }];
    channelKey = functionParameters[0].name;
    individualChannelsRequired = functionParameters;
  }
  return {
    computed: true,
    channelName: channelName,
    channelKey: channelKey,
    functionName: functionName,
    functionParameters: functionParameters,
    individualChannelsRequired: individualChannelsRequired,
  };
};

let computeChannelData = (
  computedChannel,
  dataFrame,
  subtractionOrder,
  dataId
) => {
  const functionName = computedChannel.functionName;
  switch (functionName) {
    case "MEAN":
      let computedChannelData = new FloatArrayType(dataFrame.numSamples);
      computedChannelData.fill(0);
      computedChannel.functionParameters.forEach((functionParameter) => {
        const channelIndex = indexOfChannel(
          subtractionOrder,
          functionParameter,
          dataId
        );
        const channelData = dataFrame.data[channelIndex].data;
        computedChannelData = computedChannelData.map((value, v) => {
          return value + channelData[v];
        });
      });
      const numChannelsToAverage = computedChannel.functionParameters.length;
      if (numChannelsToAverage > 1) {
        computedChannelData = computedChannelData.map((value) => {
          return value / numChannelsToAverage;
        });
      }
      return computedChannelData;
    case "IDENTITY":
      const channelIndex = indexOfChannel(
        subtractionOrder,
        computedChannel.functionParameters[0],
        dataId
      );
      const channelData = dataFrame.data[channelIndex].data;
      return channelData;
    default:
      throw new Meteor.Error(
        "get.edf.data.computed.channel.unknown.function",
        "Unknown function name for computed channel: " + functionName
      );
      break;
  }
};

let parseChannelsDisplayed = (channelsDisplayed, recordingId) => {
  var individualChannelsRequired = new Set();
  var individualChannels = [];

  let channelsDisplayedParsed = {
    subtractions: [],
  };
  console.log('fffffff')
  console.log(channelsDisplayed)

  // console.log(channelsDisplayed);
  channelsDisplayed.forEach((channel) => {
    const channelString = "" + channel;
    const channelParts = channelString.split("-");
    const subtraction = {
      key: channelString,
      dataId: recordingId,
      plus: undefined,
      minus: undefined,
    };
    channelsDisplayedParsed.subtractions.push(subtraction);
    let operandNames = ["plus", "minus"];
    channelParts.forEach((channelPart, c) => {
      if (channelPart === "") {
        return;
      }
      let operandName = operandNames[c];
      if (isInteger(channelPart)) {
        subtraction[operandName] = channelPart;
        individualChannelsRequired.add({
          name: subtraction[operandName],
          dataId: recordingId,
        });
      } else {
        individualChannels = [];
        var count = 15;
        channelsDisplayed.forEach((myChannel) => {
          count++;
          computedChannel = parseComputedChannelString(myChannel, recordingId);

          computedChannel.individualChannelsRequired.forEach((r) => {
            individualChannels.push(r);
          });
        });
      }
    });
  });

  channelsDisplayedParsed.individualChannelsRequired = individualChannels;

  return channelsDisplayedParsed;
};

let parseWFDBMetadata = (metadata) => {
  let overallAndSignals = metadata.split("\nGroup ");
  let overall = overallAndSignals[0];
  let signals = overallAndSignals.splice(1);
  let metadataParsed = {};
  overAllKeyValuePairs = overall.split("\n");
  overAllKeyValuePairs.forEach((keyValuePair, k) => {
    if (k == overAllKeyValuePairs.length - 1) {
      return;
    }
    keyValuePair = keyValuePair.split(": ");
    if (keyValuePair.length == 1) {
      keyValuePair = keyValuePair[0].split(" ");
    }
    let key = keyValuePair[0].trim().toPascalCase();
    let value = keyValuePair[1].trim();
    metadataParsed[key] = value;
    if (key == "Length") {
      let valueInSeconds = value.split(" ")[0];
      let lengthInSeconds = 0;
      let milliSecondsAndAbove = valueInSeconds.split(".");
      let milliSeconds = parseInt(milliSecondsAndAbove[1]);
      lengthInSeconds += milliSeconds / 1000.0;
      let aboveMilliSeconds = milliSecondsAndAbove[0].split(":");
      aboveMilliSeconds.reverse();
      aboveMilliSeconds.forEach((v, i) => {
        lengthInSeconds += v * Math.pow(60, i);
      });
      metadataParsed.LengthInSeconds = lengthInSeconds;
    }
  });
  let currentGroupIndex = -1;
  let groups = [];
  let group;
  metadataParsed.Groups = groups;
  signals.forEach((signal, s) => {
    let keyValuePairs = signal.split("\n");
    let groupAndSignalIndices = keyValuePairs[0];
    keyValuePairs = keyValuePairs.splice(1);
    groupAndSignalIndices = groupAndSignalIndices.split(", ");
    let groupIndex = parseInt(groupAndSignalIndices[0]);
    if (groupIndex > currentGroupIndex) {
      currentGroupIndex = groupIndex;
      group = {
        Signals: [],
        SignalsByName: {},
      };
      groups.push(group);
    }
    let signalIndex = parseInt(
      groupAndSignalIndices[1].split(":")[0].split(" ")[1]
    );
    let signalParsed = {};
    signalParsed.Group = groupIndex;
    signalParsed.Signal = signalIndex;
    keyValuePairs.forEach((keyValuePair) => {
      keyValuePair = keyValuePair.split(": ");
      if (keyValuePair.length == 1) {
        return;
      }
      let key = keyValuePair[0].trim().toPascalCase();
      if (key == "I/O") {
        key = "IO";
      }
      let value = keyValuePair[1].trim();
      signalParsed[key] = value;
    });
    group.Signals.push(signalParsed);
    group.SignalsByName[signalParsed.Description] = signalParsed;
  });
  return metadataParsed;
};

let convertEntriesToTypedFloatArrays = (dict) => {
  let dictTyped = {};
  for (key in dict) {
    dictTyped[key] = new FloatArrayType(dict[key]);
  }
  return dictTyped;
};

var isChannel = function (element) {
  // checks if the arguement is a channel
  if (!this || !this.name || !this.dataId) return false;
  if (!element.name || !element.dataId)
    throw new TypeError(`Argument is not a channel array`);
  return element.name === this.name && element.dataId === this.dataId;
};

function indexOfChannel(channelArray, index, dataId) {
  if (!channelArray || !Array.isArray(channelArray)) {
    throw new TypeError(`Argument is not a channel array`);
  }
  return channelArray.findIndex(isChannel, { name: index, dataId: dataId });
}

Meteor.methods({

  "removeFile"(id){
    EDFFile.then(result =>{
      result.remove({_id:id},function(error){
        if (error){
          console.error("File wasn't removed, error: " + error.reason)
  
        }
        else{
          console.info("File successfully removed");
        }
      })
    })

    
  },
  "get.environment.edf.dir"(){
    return (process.env.EDF_DIR);
  },
  "get.edf.metadata"(recordingName) {
    return parseWFDBMetadata(WFDB.wfdbdesc(recordingName));
  },
  "get.edf.metadata.and.length"(allRecordings) {
    // if more than one recording, the length will be the max of the two recordings
    let lengthInSeconds = 0;
    let allMetadata = {};
    allRecordings.forEach((recording) => {
      let metadata = parseWFDBMetadata(WFDB.wfdbdesc(recording.path));
      if (metadata.LengthInSeconds > lengthInSeconds) {
        lengthInSeconds = metadata.LengthInSeconds;
      }
      allMetadata[recording._id] = metadata;
    });
    console.log(allMetadata, lengthInSeconds);
    return {
      allMetadata,
      lengthInSeconds,
    };
  },
  "get.edf.data"(options) {
    //
    //console.log('get.edf.data');
    options = options || {};
    let startTime = options.start_time || 0;
    let windowLength = options.window_length;
    let count = 0;

    // this is the original version of codes which display all channels specified in the options:
    let channelsDisplayed = options.channels_displayed;
    // console.log('bbbbbb')
    // console.dir(options);
    // console.dir(channelsDisplayed);

    // let channelsDisplayed = {};

    let channelTimeshift = options.channel_timeshift;
    let allRecordings = options.recordings;

    // this is the original version of codes which display all channels specified in the options:
    // allRecordings = allRecordings.map((recording) => {
    //   recording.channelsDisplayedParsed = parseChannelsDisplayed(channelsDisplayed[recording.source], recording._id);
    //   return recording;
    // });
    // the following line get all the channels from the metadata of the recording and display all of them
    // we should modify it to be only displaying the channel required in the particular montage
    // TODO: this should only display the channels required in the montage not all of them, should speed it up

    // I think we get the channels using wfdb desc
    // allRecordings.map((recording) => {
    //   const channelDisplayed = Data.findOne(
    //     recording._id
    //   ).metadata.wfdbdesc.Groups[0].Signals.map(
    //     (channels, signal) => channels + " '" + signal.Description + "'",
    //     "-s"
    //   );
    //   channelsDisplayed[recording.source] = channelDisplayed.split(' ').slice(1, -1)
    // })
    allRecordings.map((recording) => {
      const channelDisplayed = Data.findOne(
        recording._id
      ).metadata.wfdbdesc.Groups[0].Signals.map(
        (signal) => " '" + signal.Description + "'",
        "-s"
      );
      channelsDisplayed[recording.source] = channelDisplayed
    })
    allRecordings = allRecordings.map((recording) => {
      channelsDisplayed[recording.source] = Data.findOne(
        recording._id
      ).metadata.wfdbdesc.Groups[0].Signals.map(
        (signal) => "'" + signal.Description + "'"
      );

      recording.channelsDisplayedParsed = parseChannelsDisplayed(
        channelsDisplayed[recording.source],
        recording._id
      );

      return recording;
    });

    let targetSamplingRate = options.target_sampling_rate;
    // console.log("742 targetSamplingRate: " + targetSamplingRate);
    let lowResolutionData = options.low_resolution_data;
    let useHighPrecisionSampling = options.use_high_precision_sampling;
    let atLeast1 = 0;
    let dataFrame = {};

    //console.log("get.edf.data init finished");

    var currDataFrame;
    dataFrame = allRecordings.reduce((collections, recording) => {
      // accumulate all the data from all recordings into one dataFrame object
      let startTimeAfterAdjustment = channelTimeshift[recording._id] && channelTimeshift[recording._id] !== "unalignable"
        ? startTime + channelTimeshift[recording._id]
        : startTime;

      currDataFrame = WFDB.rdsamp({
        // runs the rdsamp function with the specified parameters that we have defined above
        recordingName: recording.path,
        recordingId: recording._id,
        startTime: startTimeAfterAdjustment,
        windowLength,
        channelsDisplayed:
          recording.channelsDisplayedParsed.individualChannelsRequired.map(
            (channel) => channel.name
          ),
        targetSamplingRate,
        lowResolutionData,
        useHighPrecisionSampling,
      });

      currDataFrame.channelInfo = currDataFrame.channelNames.map(
        (channelName) => {
          return { name: channelName, dataId: recording._id };
        }
      );
      //   console.log("=====currentdataFrame.channelInfo=====");
      //   console.dir(currDataFrame.channelInfo);
      //   console.dir(
      //   recording.channelsDisplayedParsed.individualChannelsRequired.map(
      //     (channel) => channel.name
      //   )
      // );
      delete currDataFrame.channelNames;
      currDataFrame.data = currDataFrame.data.map((data) => {
        return { data: data, dataId: recording._id };
      });
      if (currDataFrame.numSamples === 0) {
        currDataFrame.startTime = Number.POSITIVE_INFINITY;
        currDataFrame.endTime = Number.NEGATIVE_INFINITY;
        currDataFrame.duration = Number.NEGATIVE_INFINITY;
        currDataFrame.samplingRate = Number.POSITIVE_INFINITY;
      }
      // console.log("794 currDataFrame.samplingRate: " + currDataFrame.samplingRate);
      if (!Object.keys(collections).length) return currDataFrame;
      collections.channelInfo = collections.channelInfo.concat(
        currDataFrame.channelInfo
      );
      collections.data = collections.data.concat(currDataFrame.data);
      collections.startTime = Math.min(
        collections.startTime,
        currDataFrame.startTime
      );
      collections.endTime = Math.max(
        collections.endTime,
        currDataFrame.endTime
      );
      collections.duration = Math.max(
        collections.duration,
        currDataFrame.duration
      );
      collections.numSamples = Math.max(
        collections.numSamples,
        currDataFrame.numSamples
      );
      // console.log("816 collections.samplingRate: " + collections.samplingRate);
      // console.log("817 currDataFrame.samplingRate: " +currDataFrame.samplingRate);
      collections.samplingRate = Math.min(
        collections.samplingRate,
        currDataFrame.samplingRate
      );
      // console.dir(collections);
      return collections;
    }, {});

    if (dataFrame.numSamples === 0) {
      return {};
    }
    // console.time('computeSubtractions');
    let channelsDisplayedParsed = allRecordings.reduce(
      (parsedCombined, recording) => {
        if (!Object.keys(parsedCombined).length)
          return recording.channelsDisplayedParsed;
        parsedCombined.subtractions = parsedCombined.subtractions.concat(
          recording.channelsDisplayedParsed.subtractions
        );
        parsedCombined.individualChannelsRequired =
          parsedCombined.individualChannelsRequired.concat(
            recording.channelsDisplayedParsed.individualChannelsRequired
          );
        return parsedCombined;
      },
      {}
    );

    // console.log("channelsDisplayedParsed:", channelsDisplayedParsed);
    let subtractionOrder = channelsDisplayedParsed.individualChannelsRequired;
    let allChannelInfo = dataFrame.channelInfo;

    channelsDisplayedParsed.subtractions.forEach((subtraction) => {
      let dataId = subtraction.dataId;
      if (indexOfChannel(subtractionOrder, subtraction.key, dataId) > -1)
        return;
      let has = {};
      let channelIndex = {};
      let channelName = {};
      let channelData = {};
      ["plus", "minus"].forEach((operandName) => {
        let operand = subtraction[operandName];
        has[operandName] = operand !== undefined;
        if (!has[operandName]) {
          return;
        }
        if (operand.computed) {
          if (
            indexOfChannel(subtractionOrder, operand.channelKey, dataId) < 0
          ) {
            let computedChannelData = computeChannelData(
              operand,
              dataFrame,
              subtractionOrder,
              dataId
            );
            allChannelInfo.push({
              name: operand.channelKey,
              dataId: dataId,
            });
            subtractionOrder.push({
              name: operand.channelKey,
              dataId: dataId,
            });
            dataFrame.data.push({
              data: computedChannelData,
              dataId: dataId,
            });
          }
          let channelIndex = indexOfChannel(
            subtractionOrder,
            operand.channelKey,
            dataId
          );
          channelData[operandName] = dataFrame.data[channelIndex].data;
          channelName[operandName] = operand.channelName;
        } else {
          let channelIndex = indexOfChannel(subtractionOrder, operand, dataId);
          channelData[operandName] = dataFrame.data[channelIndex].data;
          channelName[operandName] = allChannelInfo[channelIndex].name;
        }
      });
      let subtractionName = "";
      if (has.plus) {
        subtractionName += channelName.plus;
      }
      if (has.minus) {
        subtractionName += "-" + channelName.minus;
      }
      if (has.plus) {
        if (has.minus) {
          if (channelData.plus === channelData.minus) {
            subtractionData = new FloatArrayType(dataFrame.numSamples);
            subtractionData.fill(0);
          } else {
            subtractionData = channelData.plus.map((value, v) => {
              return value - channelData.minus[v];
            });
          }
        } else {
          subtractionData = channelData.plus;
        }
      } else {
        if (has.minus) {
          subtractionData = channelData.minus.map((value, v) => {
            return -value;
          });
        } else {
          subtractionData = new FloatArrayType(dataFrame.numSamples);
          subtractionData.fill(0);
        }
      }
      allChannelInfo.push({ name: subtractionName, dataId: dataId });
      subtractionOrder.push({ name: subtraction.key, dataId: dataId });
      dataFrame.data.push({ data: subtractionData, dataId: dataId });
    });
    // console.timeEnd('computeSubtractions');
    let channelInfoOrdered = [];
    let dataOrdered = [];
    channelsDisplayedParsed.subtractions.forEach((subtraction) => {
      const subtractionIndex = indexOfChannel(
        subtractionOrder,
        subtraction.key,
        subtraction.dataId
      );
      const channelInfo = dataFrame.channelInfo[subtractionIndex];
      const channelData = dataFrame.data[subtractionIndex].data;
      channelInfoOrdered.push(channelInfo);
      dataOrdered.push(channelData);
    });
    dataFrame.channelInfo = channelInfoOrdered;
    dataFrame.data = dataOrdered;
    // console.timeEnd('get.edf.data');
    let dataDict = {};
    dataFrame.channelInfo.forEach((info, c) => {
      if (!dataDict[info.dataId]) dataDict[info.dataId] = {};
      dataDict[info.dataId][info.name] = dataFrame.data[c];
    });

    // console.log("=====current dataFrame=====");
    // console.log("957 dataFrame.samplingRate: "+dataFrame.samplingRate);
    return {
      channel_order: dataFrame.channelInfo,
      sampling_rate: dataFrame.samplingRate,
      channel_values: dataDict,
    };
  },
  "setup.edf.downsampled"(allRecordings, metadata) {
    // a method that does the downsampling
    // currently the sampling rate (frequency) for the downsampled recording is set to 2 Hz
    let targetDownsamplingRate = "2";

    // for each recording, downsample the data
    allRecordings.forEach((recording) => {
      let recordingName = recording.path;
      let recordingMetadata = metadata[recording._id];
      WFDB.downsamp({
        recordingName,
        recordingMetadata,
        targetDownsamplingRate,
      });
    });
  },

});


// console.log(process.env.EDF_DIR);