import { dsvFormat } from 'd3-dsv';
import { Data, Assignments } from '/collections';

String.prototype.toPascalCase = function() {
  return this
    .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
    .replace(/\s/g, '');
}

// This should stay Float32Array, as this is required for the use of
// WebAudio features for digital signal processing in the frontend,
// see https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer/copyToChannel
const FloatArrayType = Float32Array;

const exec = Npm.require('child_process').exec;
const runCommand = Meteor.wrapAsync(exec);
const runWFDBCommand = (command, runInDirectory = '') => {
  // console.time('runWFDBCommand');
  let WFDBCommand = command;
  const EDFDir = process.env.EDF_DIR + '/' + runInDirectory;
  if (EDFDir) {
    WFDBCommand = 'WFDB="' + EDFDir + '" ' + WFDBCommand;
  }
  const output = runCommand(WFDBCommand, { maxBuffer: 2048 * 500 * 10 });
  // console.timeEnd('runWFDBCommand');
  return output;
};

const isAssignedToEDF = (userId, filePath) => {
  const dataIds = Data.find({ path: filePath }, { fields: { _id: 1 } }).fetch().map(doc => doc._id);
  const numAssignments = Assignments.find({ users: userId, data: { $in: dataIds } }).count();
  return numAssignments > 0;
};

let WFDB = {
  wfdbdesc (recordingFilePath) {
    const isCallFromClient = !!this.connection;
    if (isCallFromClient && !isAssignedToEDF(Meteor.userId(), recordingFilePath)) {
      throw new Meteor.Error('wfdb.wfdbdesc.command.permission.denied', 'You are not assigned to this recording. Permission denied.');
    }
    try {
      
      const recordingPathSegments = recordingFilePath.split('/');
      const recordingFilename = recordingPathSegments[recordingPathSegments.length - 1];
      delete recordingPathSegments[recordingPathSegments.length - 1];
      const recordingDirectory = recordingPathSegments.join('/');
      return runWFDBCommand('wfdbdesc "' + recordingFilename + '"', recordingDirectory);
    }
    catch (e) {
      throw new Meteor.Error('wfdb.wfdbdesc.command.failed', e.message);
    }
  },
  rdsamp (options) {
    const isCallFromClient = !!this.connection;
   
    if (isCallFromClient && !isAssignedToEDF(Meteor.userId(), options.recordingName)) {
      throw new Meteor.Error('wfdb.rdsamp.command.permission.denied', 'You are not assigned to this recording. Permission denied.');
    }
    // console.time('rdsamp');
    try {
      const useHighPrecisionSamplingString = options.useHighPrecisionSampling ? ' -P' : ' -p';
      console.log(recordingName);
      const recordingPathSegments = [options.recordingName]//split('/');
      const recordingFilename = recordingPathSegments[recordingPathSegments.length - 1];
      delete recordingPathSegments[recordingPathSegments.length - 1];
      const recordingDirectory = recordingPathSegments.join('/');
      var reqSignals = options.channelsDisplayed.join();
     
     
      var allsignals = runWFDBCommand('rdsamp -r "' + recordingFilename + '" -f ' + options.startTime + ' -l ' + options.windowLength + useHighPrecisionSamplingString + ' -c -H -v'  , recordingDirectory);
      var signalName = allsignals.split("'seconds'");
      
      allsignals = signalName[0].split(",");
   
     
      allsignals = allsignals.filter(oneSignal => reqSignals.includes(oneSignal));
 
      const signalRawOutput = runWFDBCommand('rdsamp -r "' + recordingFilename + '" -f ' + options.startTime + ' -l ' + options.windowLength + useHighPrecisionSamplingString + ' -c -H -v -s ' + allsignals.join(' '), recordingDirectory);
    
      let rows = dsvFormat(',').parseRows(signalRawOutput);
      const columnNames = rows[0].map((value) => {
        return value.substr(1).slice(0, -1);
      });
      const channelNames = columnNames.slice(1);
      rows.shift();
      const columnUnits = rows[0].map((value) => {
        return value.substr(1).slice(0, -1);
      });
      const channelUnits = columnUnits.slice(1);
      rows.shift();
      const numSamplesRaw = rows.length;
      const lastSampleIndex = numSamplesRaw - 1;
      const outputStartTimeInSeconds = parseFloat(rows[0][0]);
      const outputEndTimeInSeconds = parseFloat(rows[lastSampleIndex][0]);
      const outputDurationInSeconds = outputEndTimeInSeconds - outputStartTimeInSeconds;
      const samplingRateRaw = numSamplesRaw / outputDurationInSeconds;
      let downSamplingFactor = 0;
      if (options.targetSamplingRate > 0) {
        downSamplingFactor = Math.round(samplingRateRaw / options.targetSamplingRate);
      }
      if (downSamplingFactor > 1) {
        rows = rows.filter((row, r) => {
          return (r % downSamplingFactor !== 0);
        });
      }
      const numSamples = rows.length;
      const samplingRate = Math.round(numSamples / outputDurationInSeconds);
      const data = channelNames.map(() => {
        return new FloatArrayType(numSamples);
      });
      rows.forEach((row, r) => {
        // ignore first column (elapsed time)
        row.shift();
        row.forEach((value, c) => {
          if (value === '-') {
            value = 0.0;
          }
          else {
            value = parseFloat(value);
          }
          data[c][r] = value;
        })
      });
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
    }
    catch (e) {
      // console.timeEnd('rdsamp');
      if (e.message.split('\n')[1] !== undefined && e.message.split('\n')[1].trim() == '') {
        return {
          numSamples: 0,
        };
      }
      else {
        throw new Meteor.Error('wfdb.rdsamp.command.failed', e.message);
      }
    }
  },
}

let isInteger = (expression) => {
  return expression == '' + parseInt(expression);
}
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
let parseComputedChannelString = (computedChannelString) => {
  const parts = computedChannelString.split('=');
  const channelName = parts[0].trim();
  let channelKey;
  let functionParameters;
  let functionName;
 if(parts.length > 1 ){
    const formula = parts[1].trim();
    const formulaParts = formula.split('(');
    
    if (formulaParts.length == 1) {
      functionName = 'IDENTITY';
      functionParameters = [ formulaParts[0] ];
      channelKey = functionParameters[0];
    }
    else {
      functionName = formulaParts[0];
      functionParameters = formulaParts[1].slice(0, -1).split(',').map((parameter) => { return parameter.trim(); })
      channelKey = functionName + '(' + functionParameters.join(',') + ')';
    }
  
  
  let individualChannelsRequired;
  switch (functionName) {
    case 'MEAN':
    case 'IDENTITY':
      individualChannelsRequired = functionParameters;
      break;
    default:
      throw new Meteor.Error('get.edf.data.computed.channel.unknown.function', 'Unknown function name for computed channel: ' + functionName);
      break;
  }
}
  else{
    functionName = 'IDENTITY';
    functionParameters = [ channelName];
    channelKey = functionParameters[0];
    individualChannelsRequired = functionParameters;
  }
  return {
    computed: true,
    channelName: channelName,
    channelKey: channelKey,
    functionName: functionName,
    functionParameters: functionParameters,
    individualChannelsRequired: individualChannelsRequired,
  }
}

let computeChannelData = (computedChannel, dataFrame, subtractionOrder) => {
  const functionName = computedChannel.functionName;
  switch (functionName) {
    case 'MEAN':
      let computedChannelData = new FloatArrayType(dataFrame.numSamples);
      computedChannelData.fill(0);
      computedChannel.functionParameters.forEach((functionParameter) => {
        const channelIndex = subtractionOrder.indexOf(functionParameter);
        const channelData = dataFrame.data[channelIndex];
        computedChannelData = computedChannelData.map((value, v) => { return value + channelData[v]; });
      });
      const numChannelsToAverage = computedChannel.functionParameters.length;
      if (numChannelsToAverage > 1) {
        computedChannelData = computedChannelData.map((value) => { return value / numChannelsToAverage; });
      }
      return computedChannelData;
    case 'IDENTITY':
      const channelIndex = subtractionOrder.indexOf(computedChannel.functionParameters[0]);
      const channelData = dataFrame.data[channelIndex];
      return channelData;
    default:
      throw new Meteor.Error('get.edf.data.computed.channel.unknown.function', 'Unknown function name for computed channel: ' + functionName);
      break;
  }
}

let parseChannelsDisplayed = (channelsDisplayed) => {
  individualChannelsRequired = new Set();
  var individualChannels= [];
  
  let channelsDisplayedParsed = {
    subtractions: [],
  }
  
  channelsDisplayed.forEach((channel) => {
    const channelString = '' + channel;
    const channelParts = channelString.split('-');
    const subtraction = {
      key: channelString,
      plus: undefined,
      minus: undefined,
    }
    
    channelsDisplayedParsed.subtractions.push(subtraction);
    let operandNames = ['plus', 'minus']
    channelParts.forEach((channelPart, c) => {
      if (channelPart === '') {
        return;
      }
      let operandName = operandNames[c];
      if (isInteger(channelPart)) {
        subtraction[operandName] = channelPart;
        individualChannelsRequired.add(subtraction[operandName]);
        
      }
      else {
        
        individualChannels = [];
        var count = 15;
        channelsDisplayed.forEach((myChannel) => {
        
          count++;
          computedChannel = parseComputedChannelString(myChannel);
          
         (computedChannel.individualChannelsRequired).forEach((r) => {
            
            individualChannels.push(r)
           
          })
        });

          }
        });
      })

 
  

  channelsDisplayedParsed.individualChannelsRequired = individualChannels;
  
  return channelsDisplayedParsed;
};

let parseWFDBMetadata = (metadata) => {
  let overallAndSignals = metadata.split('\nGroup ');
  let overall = overallAndSignals[0];
  let signals = overallAndSignals.splice(1);
  let metadataParsed = {}
  overAllKeyValuePairs = overall.split('\n');
  overAllKeyValuePairs.forEach((keyValuePair, k) => {
    if (k == overAllKeyValuePairs.length - 1) {
      return;
    }
    keyValuePair = keyValuePair.split(': ');
    if (keyValuePair.length == 1) {
      keyValuePair = keyValuePair[0].split(' ');
    }
    let key = keyValuePair[0].trim().toPascalCase();
    let value = keyValuePair[1].trim();
    metadataParsed[key] = value;
    if (key == 'Length') {
      let valueInSeconds = value.split(' ')[0];
      let lengthInSeconds = 0;
      let milliSecondsAndAbove = valueInSeconds.split('.')
      let milliSeconds = parseInt(milliSecondsAndAbove[1]);
      lengthInSeconds += milliSeconds / 1000.0;
      let aboveMilliSeconds = milliSecondsAndAbove[0].split(':');
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
    let keyValuePairs = signal.split('\n');
    let groupAndSignalIndices = keyValuePairs[0];
    keyValuePairs = keyValuePairs.splice(1);
    groupAndSignalIndices = groupAndSignalIndices.split(', ');
    let groupIndex = parseInt(groupAndSignalIndices[0]);
    if (groupIndex > currentGroupIndex) {
      currentGroupIndex = groupIndex;
      group = {
        Signals: [],
        SignalsByName: {},
      };
      groups.push(group);
    }
    let signalIndex = parseInt(groupAndSignalIndices[1].split(':')[0].split(' ')[1]);
    let signalParsed = {};
    signalParsed.Group = groupIndex;
    signalParsed.Signal = signalIndex;
    keyValuePairs.forEach((keyValuePair) => {
      keyValuePair = keyValuePair.split(': ');
      if (keyValuePair.length == 1) {
        return;
      }
      let key = keyValuePair[0].trim().toPascalCase();
      if (key == 'I/O') {
        key = 'IO';
      }
      let value = keyValuePair[1].trim();
      signalParsed[key] = value;
    });
    group.Signals.push(signalParsed);
    group.SignalsByName[signalParsed.Description] = signalParsed;
  });
  return metadataParsed;
}

let convertEntriesToTypedFloatArrays = (dict) => {
  let dictTyped = {};
  for (key in dict) {
    dictTyped[key] = new FloatArrayType(dict[key]);
  }
  return dictTyped;
}

Meteor.methods({
  'get.edf.metadata' (recordingName) {
    return parseWFDBMetadata(WFDB.wfdbdesc(recordingName));
  },
  'get.edf.data' (options, options2) {
    // console.time('get.edf.data');
    options = options || {};
    options2 = options2 || {};
    let startTime = options.start_time || 0;
    let windowLength = options.window_length;
    let count = 0;
    let channelsDisplayed = options.channels_displayed;
    let channelsDisplayed2 = options.channels_displayed;
    let channelsDisplayedParsed = parseChannelsDisplayed(channelsDisplayed);
    let channelsDisplayedParsed2 = parseChannelsDisplayed(channelsDisplayed2);
    let channelsDelayed = options.channelsDelayed;
    let recordingName = options.recording_name;
    let recordingName2 = options2.recording_name;
    let targetSamplingRate = options.target_sampling_rate;
    let useHighPrecisionSampling = options.use_high_precision_sampling;
    let delayExists = options.delayExists;
    let atLeast1 = 0;
    let dataFrame = {};
    let dataFrame2 = {}
 
    if(channelsDelayed && channelsDelayed.delayAmount && channelsDelayed.delayAmount.length > 0 ){

      let notDelayed = channelsDisplayed.filter( x => !channelsDelayed.channelNames.includes(x));
      
    
    
      let notDelayedParsed = parseChannelsDisplayed(notDelayed); 
      var sTime = startTime;
      if(notDelayed.length == 0 )
      { 
        
      let currParsed = {};
      let delayedTime = 0;
    
      
      channelsDelayed.channelNames.forEach(channel => {
      
        currParsed = parseChannelsDisplayed([channel]);
        
        
        if(channelsDelayed.delayAmount[channelsDelayed.channelNames.indexOf(channel)]){
             
          startTime = startTime + channelsDelayed.delayAmount[channelsDelayed.channelNames.indexOf(channel)];
          
        }
      
        currDataframe = WFDB.rdsamp({
          recordingName,
          startTime,
          windowLength,
          channelsDisplayed: currParsed.individualChannelsRequired,
          targetSamplingRate,
          useHighPrecisionSampling,
        });
       
     
        if(atLeast1 == 0|| !dataFrame ||dataFrame.size == 0 || dataFrame.length == 0 || dataFrame == {} || !dataFrame.channelNames){
      
          dataFrame = currDataframe;
          dataFrame.channelNames = currDataframe.channelNames;
          dataFrame.data = currDataframe.data;
          atLeast1 = 1;
        }
        else{
      
        dataFrame.channelNames.push(currDataframe.channelNames[0]);
       
        dataFrame.data.push(currDataframe.data[0]);
       
        }
        startTime = sTime;
        
        count++;
      } )
    
      
    }

      
      else{
       
        dataFrame = WFDB.rdsamp({
        recordingName,
        startTime,
        windowLength,
        channelsDisplayed: notDelayedParsed.individualChannelsRequired,
        targetSamplingRate,
        useHighPrecisionSampling,
      });
     
      let currParsed = {};
      let delayedTime = 0;
      channelsDelayed.channelNames.forEach(channel => {
        currParsed = parseChannelsDisplayed([channel]);
        

        startTime = startTime + channelsDelayed.delayAmount[channelsDelayed.channelNames.indexOf(channel)];
      
        currDataframe = WFDB.rdsamp({
          recordingName,
          startTime,
          windowLength,
          channelsDisplayed: currParsed.individualChannelsRequired,
          targetSamplingRate,
          useHighPrecisionSampling,
        });
        dataFrame.channelNames.push(currDataframe.channelNames[0]);
        dataFrame.data.push(currDataframe.data[0]);
      
        startTime = sTime;
    
      } )
      

    }
    }
    else {

      dataFrame = WFDB.rdsamp({
      recordingName,
      startTime,
      windowLength,
      channelsDisplayed: channelsDisplayedParsed.individualChannelsRequired,
      targetSamplingRate,
      useHighPrecisionSampling,
    });

    let temprName = recordingName;
    recordingName = tempName;
    dataFrame2 = WFDB.rdsamp({
      recordingName,
      startTime,
      windowLength,
      channelsDisplayed: channelsDisplayedParsed2.individualChannelsRequired,
      targetSamplingRate,
      useHighPrecisionSampling,
    });
    dataFrame2.channelNames.forEach( channel => {
      dataFrame.channelNames.push(channel);
    })
   
       
    dataFrame2.data.forEach( dataSet => {
      dataFrame.data.push(dataSet);
    })
   dataFrame.numSamples = dataFrame.numSamples + dataFrame2.numSamples;
   recordingName =temprName
  };
    if (dataFrame.numSamples == 0) {
      return {};
    }
    // console.time('computeSubtractions');
    let subtractionOrder = channelsDisplayedParsed.individualChannelsRequired.slice();
    let channelNames = dataFrame.channelNames;

    channelsDisplayedParsed.subtractions.forEach((subtraction) => {
      if (subtractionOrder.indexOf(subtraction.key) > -1) {
        return;
      }
      let has = {};
      let channelIndex = {};
      let channelName = {};
      let channelData = {};
      ['plus', 'minus'].forEach((operandName) => {
        let operand = subtraction[operandName];
        has[operandName] = operand !== undefined;
        if (!has[operandName]) {
          return;
        }
        if (operand.computed) {
          if (subtractionOrder.indexOf(operand.channelKey) < 0) {
            let computedChannelData = computeChannelData(operand, dataFrame, subtractionOrder);
            channelNames.push(operand.channelKey);
            subtractionOrder.push(operand.channelKey);
            dataFrame.data.push(computedChannelData);
          }
          let channelIndex = subtractionOrder.indexOf(operand.channelKey);
          channelData[operandName] = dataFrame.data[channelIndex];
          channelName[operandName] = operand.channelName;
        }
        else {
          let channelIndex = subtractionOrder.indexOf(operand);
          channelData[operandName] = dataFrame.data[channelIndex];
          channelName[operandName] = channelNames[channelIndex];
        }
      });
      let subtractionName = '';
      if (has.plus) {
        subtractionName += channelName.plus;
      }
      if (has.minus) {
        subtractionName += '-' + channelName.minus;
      }
      if (has.plus) {
        if (has.minus) {
          if (channelData.plus === channelData.minus) {
            subtractionData = new FloatArrayType(dataFrame.numSamples);
            subtractionData.fill(0);
          }
          else {
            subtractionData = channelData.plus.map((value, v) => { return value - channelData.minus[v]; });
          }
        }
        else {
          subtractionData = channelData.plus;
        }
      }
      else {
        if (has.minus) {
          subtractionData = channelData.minus.map((value, v) => { return -value; });
        }
        else {
          subtractionData = new FloatArrayType(dataFrame.numSamples);
          subtractionData.fill(0);
        }
      }
      channelNames.push(subtractionName);
      subtractionOrder.push(subtraction.key);
      dataFrame.data.push(subtractionData);
    });
    // console.timeEnd('computeSubtractions');
    let channelNamesOrdered = [];
    let dataOrdered = [];
    channelsDisplayedParsed.subtractions.forEach((subtraction) => {
      const subtractionIndex = subtractionOrder.indexOf(subtraction.key);
      const channelName = dataFrame.channelNames[subtractionIndex];
      const channelData = dataFrame.data[subtractionIndex];
      channelNamesOrdered.push(channelName);
      dataOrdered.push(channelData);
    });
    dataFrame.channelNames = channelNamesOrdered;
    dataFrame.data = dataOrdered;
    // console.timeEnd('get.edf.data');
    let dataDict = {};
    dataFrame.channelNames.forEach((channelName, c) => {
      dataDict[channelName] = dataFrame.data[c];
    });

    return {
      channel_order: dataFrame.channelNames,
      sampling_rate: dataFrame.samplingRate,
      channel_values: dataDict,
    }
  }
});