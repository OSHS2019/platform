import {
	Patients,
	Data,
	Tasks,
	Assignments,
	Annotations,
	Preferences,
} from "/collections";

import { FilesCollection } from 'meteor/ostrio:files';

/*
const userAccounts = {
	ADMIN: {
		username: "Admin User",
		email: "admin@example.com",
		password: "changeme1234",
		roles: {
			__global_roles__: ["admin"],
		},
	},
	TEST: {
		username: "Test User",
		email: "test@example.com",
		password: "test",
		roles: {
			__global_roles__: ["tester"],
		},
	},
};
*/

const userAccounts = {
	TEST: {
		username: "Test User",
		email: "test@example.com",
		password: "test",
		roles: {
			__global_roles__: ["tester"],
		},
	},
};
const rootUser = userAccounts["ADMIN"];
const testUser = userAccounts["TEST"];





const recordingPaths = [
  // { path: "/physionet/edfx/SC4001E0-PSG.edf", source: "PSG" },
  // { path: "/physionet/edfx/200930_761428_ANNE.edf", source: "ANNE" },
  // { path: "/physionet/edfx/200930_761428_PSGfiltered.edf", source: "PSG" },
  // { path: "/physionet/edfx/03_001_AxivityNEW.edf", source: "GENEActiv" },
  // {
  // 	path: "/physionet/edfx/170814_3104359_PSGfiltered.edf",
  // 	source: "PSG",
  // },
  //   { path: "/physionet/edfx/351PSG.edf", source: "PSG" },
  //   { path: "/physionet/edfx/351MUSE.edf", source: "MUSE" },
  //   { path: "/physionet/edfx/161PSG.edf", source: "PSG" },
  //   { path: "/physionet/edfx/161MUSE.edf", source: "MUSE" },
  { path: "/physionet/edfx/ANNE.edf", source: "ANNE" },
  { path: "/physionet/edfx/PSG.edf", source: "PSG" },
  // { path: "/physionet/edfx/mixed.edf", source: "PSG" },

  // {
  // 	path: "/physionet/edfx/001D_left wrist_038090_2017-08-15 17-20-38.bin",
  // 	source: "GENEActiv"},

  // only include the following if you have already downloaded and placed these edf files in the directory

  // { path: '/physionet/edfx/211005_34467350/211005_34467350_PSGfiltered.edf', source: 'PSG'},
  // { path: '/physionet/edfx/211005_34467350/211005.edf', source: 'ANNE'},
  // { path: '/physionet/edfx/211005_34467350/edf_2021-10-05T21_10_31-04_00_5007-7WNR-1FDA.filtered.edf', source: 'MUSE'},
  // { path: '/physionet/edfx/211007_7999174/211007_7999174_PSGfiltered.edf', source: 'PSG'},
  // { path: '/physionet/edfx/211007_7999174/211007.edf', source: 'ANNE'},
  // { path: '/physionet/edfx/211007_7999174/edf_2021-10-07T22_00_55-04_00_5008-LL4V-33C2.filtered.edf', source: 'MUSE'},
  // { path: '/physionet/edfx/211012_3071366/211012_3071366_PSGfiltered.edf', source: 'PSG'},
  // { path: '/physionet/edfx/211012_3071366/211012.edf', source: 'ANNE'},
  // { path: '/physionet/edfx/211012_3071366/edf_2021-10-12T21_57_06-04_00_5008-LZRH-333A.filtered.edf', source: 'MUSE'},
  // { path: '/physionet/edfx/211014_112953/211014_112953_PSGfiltered.edf', source: 'PSG'},
  // { path: '/physionet/edfx/211014_112953/211014.edf', source: 'ANNE'},
  // { path: '/physionet/edfx/211014_112953/edf_2021-10-14T23_08_09-04_00_5007-7WNR-1FDA.filtered.edf', source: 'MUSE'},
  // { path: '/physionet/edfx/211027_3502871/211027_3502871_PSGfiltered.edf', source: 'PSG'},
  // { path: '/physionet/edfx/211027_3502871/211027.edf', source: 'ANNE'},
  // { path: '/physionet/edfx/211101_2699455/211101_2699455_PSGfiltered.edf', source: 'PSG'},
  // { path: '/physionet/edfx/211101_2699455/211101.edf', source: 'ANNE'},
  // { path: '/physionet/edfx/211101_2699455/edf_2021-11-01T21_57_56-04_00_5008-LZRH-333A.filtered.edf', source: 'MUSE'},
  // { path: '/physionet/edfx/211104_3530644/211104_3530644_PSGfiltered.edf', source: 'PSG'},
  // { path: '/physionet/edfx/211104_3530644/211104.edf', source: 'ANNE'},
  // { path: '/physionet/edfx/211104_3530644/edf_2021-11-04T21_25_25-04_00_5007-ELYP-1F41.filtered.edf', source: 'MUSE'},
  // { path: '/physionet/edfx/211111_5068618/211111_5068618_PSGfiltered.edf', source: 'PSG'},
  // { path: '/physionet/edfx/211111_5068618/211111.edf', source: 'ANNE'},
  // { path: '/physionet/edfx/211111_5068618/edf_2021-11-11T21_23_41-05_00_5007-7WNR-1FDA.filtered.edf', source: 'MUSE'},
];

var recordingInfo = {};

Meteor.startup(() => {
  // Create a task names schema in the DB
  //TaskNames = new Mongo.Collection("tasknames");

  let addData = function (dataInfo, recordingFileFolder) {
    if (recordingInfo[recordingFileFolder] !== undefined) {
      recordingInfo[recordingFileFolder].push(dataInfo);
    } else {
      recordingInfo[recordingFileFolder] = [dataInfo];
    }
  };
  
  for (let userName in userAccounts) {
    const user = userAccounts[userName];
    const userDoc = Accounts.findUserByEmail(user.email);

    if (userDoc) {
      user._id = userDoc._id;
    } else {
      user._id = Accounts.createUser({
        username: user.username,
        email: user.email,
        password: user.password,
      });
      if (user.roles) {
        for (var group in user.roles) {
          console.log(group);
          console.log(user._id);
          console.log(user.roles[group]);
          Roles.addUsersToRoles(user._id, user.roles[group], group);
          console.log(user);
        }
      }
      console.log('Created user account "' + user.username + '", "' + user.email + '" (' + user._id + ')');
    }
  }
  

  recordingPaths.forEach((recordingPath) => {
    const recordingPathParts = recordingPath.path.split("/");
    const recordingFilename = recordingPathParts[recordingPathParts.length - 1];
    const recordingFileFolder =
      recordingPathParts[recordingPathParts.length - 2];
    let data = Data.findOne({
      name: recordingFilename,
      type: "EDF",
      path: recordingPath.path,
    });
    if (data) {
      let dataInfo = {
        id: data._id,
        source: recordingPath.source,
        path: recordingPath.path,
      };
      addData(dataInfo, recordingFileFolder);
      return;
    }
    let patientNumber = recordingFilename.split("-")[0];
    patientNumber = "" + patientNumber;
    let patient = Patients.findOne({
      id: patientNumber,
    });
    let patientId;
    if (patient) {
      patientId = patient._id;
      //console.log('Patient #' + patientNumber + ' (' + patientId + ') already exists. Re-using patient ...');
    } else {
      patientId = Patients.insert({
        id: patientNumber,
      });
      //console.log('Created Patient #' + patientNumber + ' (' + patientId + ')');
    }
    //console.log(recordingFilename, patientNumber);
    const metadataEDF = Meteor.call("get.edf.metadata", recordingPath.path);
    const metadata = {
      wfdbdesc: metadataEDF,
    };
    const dataId = Data.insert({
      name: recordingFilename,
      type: "EDF",
      source: recordingPath.source,
      patient: patientId,
      path: recordingPath.path,
      metadata: metadata,
    });
    console.log('Created Data "' + recordingPath.path + '" (' + dataId + ")");
    //console.log(metadata.wfdbdesc.Groups[0]);
    let dataInfo = {
      id: dataId,
      source: recordingPath.source,
      path: recordingPath.path,
    };
    addData(dataInfo, recordingFileFolder);
  });

  let addTask = function (
    recordingFileFolder,
    defaultMontage,
    recordingFilesPath
  ) {
    let taskName =
      "Sleep Staging (Physionet EDFX) " +
      recordingFileFolder +
      " " +
      defaultMontage;
    let task = Tasks.findOne({ name: taskName });
    let taskId;
    if (task) {
      taskId = task._id;
    }
    if (!task) {
      var wsize = 30;
      taskId = Tasks.insert({
        name: taskName,
        allowedDataTypes: ["EDF"],
        annotator: "EDF",
        annotatorConfig: {
          defaultMontage: defaultMontage,
          channelsDisplayed: {
            "MUSE + PSG": {
              MUSE: [
                "'eeg-ch1 - eeg-ch2'",
                "'eeg-ch4 - eeg-ch2'",
                "'eeg-ch1'",
                "'eeg-ch4'",
                "'eeg-ch1-eeg-ch4'",
                "'eeg-ch4-eeg-ch3'",
                "'acc-ch1'",
                "'acc-ch2'",
                "'acc-ch3'",
              ],
              PSG: [
                "'F4-A1'",
                "'C4-A1'",
                "'O2-A1'",
                "'LOC-A2'",
                "'ROC-A1'",
                "'Chin 1-Chin 2'",
              ],
            },
            "PSG + ANNE": {
              PSG: ["'Thor'", "'Abdo'", "'Snore'", "'Chin 1-Chin 2'", "'ECG'"],
              ANNE: [
                "'ECG'",
                // // "'Pleth'",
                "'Accl Pitch'",
                "'Accl Roll'",
                "'Resp Effort'",
                // // "'PAT(ms)'",
                // // "'PR(bpm)'",
                // "'PAT_resp'",
                // "'Snore'",
                // "'PAT_trend'",
                // "'PI(%)'",
                // "'HR(bpm)'",
                // "'RR(rpm)'",
                // "'SpO2(%)'",
                // "'Chest Temp(A C)'",
                // "'Limb Temp(A C)'",
              ],
            },
            "GENEActiv + PSG": {
              GENEActiv: ["'light'", "'ENMO'", "'z-angle'"],
              PSG: ["'Chin1-Chin2'", "'Leg/L'", "'Leg/R'"],
            },

            PSG: {
              PSG: [
                "'F4-A1'",
                "'C4-A1'",
                "'O2-A1'",
                "'LOC-A2'",
                "'ROC-A1'",
                "'Chin 1-Chin 2'",
                "'ECG'",
                "'Leg/L'",
                "'Leg/R'",
                "'Snore'",
                "'Airflow'",
                "'Nasal Pressure'",
                "'Thor'",
                "'Abdo'",
                "'SpO2'",
              ],
            },
            ANNE: {
              ANNE: [
                "'ECG'",
                "'Accl Pitch'",
                "'Accl Roll'",
                "'Resp Effort'",
                "'PAT'",
                "'PAT_resp'",
                "'Snore'",
                "'SpO2'",
                "'Pleth'",
                "'PAT_trend'",
                "'HR'",
                "'Chest Temp'",
                "'Limb Temp'",
                // "'PR(bpm)'",
                // "'PI(%)'",
                // "'RR(rpm)'",
              ],
            },
            MUSE: {
              MUSE: [
                "'eeg-ch1 - eeg-ch2'",
                "'eeg-ch4 - eeg-ch2'",
                "'eeg-ch1'",
                "'eeg-ch4'",
                "'eeg-ch1-eeg-ch4'",
                "'eeg-ch4-eeg-ch3'",
                "'eeg-ch2'",
                "'eeg-ch3'",
                "'acc-ch1'",
                "'acc-ch2'",
                "'acc-ch3'",
                "'ppg-ch2'",
              ],
            },
            GENEActiv: {
              GENEActiv: ["'Temp'", "'light'", "'ENMO'", "'z - angle'"],
            },
          },
          channelGains: {
            "MUSE + PSG": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            "PSG + ANNE": [
              1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            ],
            "GENEActiv + PSG": [1, 1, 1, 1, 1, 1],
            "Show all Signals": [
              0,
              //1,
              //0.8,
              //    0.10737418240000006,
              //  1009.7419586828951,
              //2.44140625
              0.03051804379, 0.03051804379, 0.03051804379, 0.03051804379,
              0.00003051804379, 0.00003051804379, 0.00003814755474,
              0.0003051804379, 0.0003051804379,
            ],
            "EEG + EOG + Chin EMG": [
              1.5625, 2.44140625, 0.5120000000000001, 1009.741958682895,
            ],
            PSG: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            ANNE: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            GENEActiv: [1, 1, 1, 1],
          },
          staticFrequencyFiltersByDataModality: {
            "'F4-A1'": { highpass: 0.3, lowpass: 35 },
            "'C4-A1'": { highpass: 0.3, lowpass: 35 },
            "'O2-A1'": { highpass: 0.3, lowpass: 35 },
            "'Chin1-Chin2'": { highpass: 10, lowpass: 100 },
            "'LOC-O2'": { highpass: 0.3, lowpass: 35 },
            "'ECG'": { highpass: 0.3, lowpass: 70 },
            "'Leg/L'": { highpass: 10, lowpass: 100 },
            "'Leg/R'": { highpass: 10, lowpass: 100 },
            "'Snore'": { highpass: 10, lowpass: 100 },
            "'Airflow'": { highpass: 0.01, lowpass: 15 },
            "Nasal Pressure": { highpass: 0.01, lowpass: 15 },
            "'Thor'": { highpass: 0.01, lowpass: 15 },
            "'Abdo'": { highpass: 0.01, lowpass: 15 },

            "'EEG'": { highpass: 0.3, lowpass: 35 },
            "'EOG'": { highpass: 0.3, lowpass: 35 },
            "'EMG'": { highpass: 10, lowpass: 100 },
            "'RESP'": { highpass: 0.01, lowpass: 15 },

            "'A1'": { highpass: 0.3, lowpass: 35 },
            "'A2'": { highpass: 0.3, lowpass: 35 },

            "'ROC'": { highpass: 0.3, lowpass: 35 },

            "'Chin 2'": { highpass: 10, lowpass: 100 },

            "'eeg-ch1 - eeg-ch2'": { highpass: 0.3, lowpass: 35 },
            "'eeg-ch4 - eeg-ch2'": { highpass: 0.3, lowpass: 35 },
            "'eeg-ch1'": { highpass: 0.3, lowpass: 35 },
            "'eeg-ch4'": { highpass: 0.3, lowpass: 35 },
            "'eeg-ch1-eeg-ch4'": { highpass: 0.3, lowpass: 35 },
            "'eeg-ch4-eeg-ch3'": { highpass: 0.3, lowpass: 35 },
            "'eeg-ch2'": { highpass: 0.3, lowpass: 35 },
            "'eeg-ch3'": { highpass: 0.3, lowpass: 35 },
            "'eeg-ch2'": { highpass: 0.3, lowpass: 35 },
            "'eeg-ch3'": { highpass: 0.3, lowpass: 35 },
            "'ppg-ch2'": { highpass: 0.1, lowpass: 5 },
            "'Temp'": { highpass: 10, lowpass: 100 },
            "'light'": { highpass: 10, lowpass: 100 },
            "'ENMO'": { highpass: 10, lowpass: 100 },
            "'z - angle'": { highpass: 10, lowpass: 100 },
          },
          frequencyFilters: [
            {
              title: "Notch",
              type: "notch",
              options: [
                {
                  name: "60 Hz",
                  value: 60,
                },
                {
                  name: "50 Hz",
                  value: 50,
                },
                {
                  name: "off",
                  value: undefined,
                  default: true,
                },
              ],
            },
          ],
          targetSamplingRate: 32,
          useHighPrecisionSampling: false,
          startTime: 0,
          windowSizeInSeconds: wsize,
          preloadEntireRecording: false,
          showReferenceLines: false,
          showSleepStageButtons: false,
          showChannelGainAdjustmentButtons: false,
          showBackToLastActiveWindowButton: false,
          showInputPanelContainer: false,
          showBookmarkCurrentPageButton: false,
          showFastForwardButton: true,
          showFastBackwardButton: true,
          graph: {
            height: 530,
            enableMouseTracking: true,
          },
          features: {
            order: ["sleep_spindle", "k_complex", "rem", "vertex_wave"],
            options: {},
          },
        },
      });
      task = Tasks.findOne(taskId);
      return taskId;
      //console.log('Created Task "' + taskName + '" (' + taskId + ')');
    }

    let dataIds = [];
    let dataNames = "";
    recordingFilesPath.forEach((recordingPath) => {
      const recordingPathParts = recordingPath.split("/");
      const recordingFilename =
        recordingPathParts[recordingPathParts.length - 1];
      let data = Data.findOne({
        name: recordingFilename,
        type: "EDF",
        path: recordingPath,
      });
      if (!data) return;
      dataIds.push(data._id);
      dataNames += data.name + ", ";
    });
    dataNames = dataNames.slice(0, -2);

    assignment = Assignments.findOne({
      users: testUser._id,
      task: taskId,
      dataFiles: dataIds,
    });
    if (!assignment) {
      const assignmentId = Assignments.insert({
        users: [testUser._id],
        task: taskId,
        dataFiles: dataIds,
        status: "Pending",
        channelsDelayed: "",
      });
      console.log('Created Assignment for Task "' + task.name + '", User "' + testUser.email + '" and Data "' + dataNames +'" (' + assignmentId + ')');
    }
  };

  Object.keys(recordingInfo).forEach((recordingFileFolder) => {
    let museFilePath, psgFilePath, anneFilePath, geneFilePath;
    recordingInfo[recordingFileFolder].forEach((recordingFile) => {
      if (recordingFile.source === "MUSE") {
        //console.log(recordingFile.path);
        museFilePath = recordingFile.path;
      } else if (recordingFile.source === "PSG") {
        psgFilePath = recordingFile.path;
      } else if (recordingFile.source === "ANNE") {
        anneFilePath = recordingFile.path;
      } else if (recordingFile.source === "GENEActiv") {
        geneFilePath = recordingFile.path;
      }
    });

    // testing for multi-file alignment features
    if (psgFilePath && anneFilePath) {
      addTask(recordingFileFolder, "PSG + ANNE", [psgFilePath, anneFilePath]);
    }
    if (museFilePath && psgFilePath) {
      addTask(recordingFileFolder, "MUSE + PSG", [museFilePath, psgFilePath]);
    }
    if (geneFilePath && psgFilePath) {
      addTask(recordingFileFolder, "GENEActiv + PSG", [
        geneFilePath,
        psgFilePath,
      ]);
    }

    // testing for single-file alignment features
    if (geneFilePath) {
      addTask(recordingFileFolder, "GENEActiv", [geneFilePath]);
    }

    if (museFilePath) {
      addTask(recordingFileFolder, "MUSE", [museFilePath]);
    }

    if (psgFilePath) {
      var taskId = addTask(recordingFileFolder, "PSG", [psgFilePath]);
      Data.update({name: "PSG.edf"}, {$set: {defaultTask: taskId}});
    }

    if (anneFilePath) {
      var taskId = addTask(recordingFileFolder, "ANNE", [anneFilePath]);
      Data.update({name: "ANNE.edf"}, {$set: {defaultTask: taskId}});
    }

  });
});


  /** The following commented out codes are the original way basicDemo.js creating new    and assignments
   *  which is outdated if having sub-folders under where we store the edf files
   */

  // const taskName = 'Sleep Staging (Physionet EDFX) ';

  // let task = Tasks.findOne({ name: taskName });
  // let taskId;
  // if (task) {
  //     taskId = task._id;
  // }
  // if (!task) {
  //     var wsize = 30;
  //     if(taskName.includes("ANNE") || taskName.includes("MUSE")){
  //         wsize = 300;
  //     }
  //     taskId = Tasks.insert({
  //         name: taskName,
  //         allowedDataTypes: ['EDF'],
  //         annotator: 'EDF',
  //         annotatorConfig: {
  //             defaultMontage: 'PSG + ANNE',
  //             channelsDisplayed: {
  //                 'MUSE + PSG': {
  //                     'MUSE': [
  //                         "'eeg-ch1 - eeg-ch2'",
  //                         "'eeg-ch4 - eeg-ch2'",
  //                         "'eeg-ch1'",
  //                         "'eeg-ch4'",
  //                         "'eeg-ch1-eeg-ch4'",
  //                         "'eeg-ch4-eeg-ch3'",
  //                         "'acc-ch1'",
  //                         "'acc-ch2'",
  //                         "'acc-ch3'",
  //                     ],
  //                     'PSG': [
  //                         "'F4-A1'",
  //                         "'C4-A1'",
  //                         "'O2-A1'",
  //                         "'LOC-A2'",
  //                         "'ROC-A1'",
  //                         "'Chin 1-Chin 2'",
  //                     ],
  //                 },
  //                 'PSG + ANNE': {
  //                     'PSG': [
  //                         "'ECG'",
  //                         "'Thor'",
  //                         "'Abdo'",
  //                         "'Snore'",
  //                         "'Chin 1-Chin 2'",
  //                     ],
  //                     'ANNE': [
  //                         "'ECG'",
  //                         "'Pleth'",
  //                         "'Accl Pitch'",
  //                         "'Accl Roll'",
  //                         "'Resp Effort'",
  //                         "'PAT(ms)'",
  //                         "'PR(bpm)'",
  //                         "'PAT_resp'",
  //                         "'Snore'",
  //                         "'PAT_trend'",
  //                         "'PI(%)'",
  //                         "'HR(bpm)'",
  //                         "'RR(rpm)'",
  //                         "'SpO2(%)'",
  //                         "'Chest Temp(A C)'",
  //                         "'Limb Temp(A C)'",
  //                     ],
  //                 },
  //                 'PSG':{
  //                     'PSG': [
  //                         "'F4-A1'",
  //                         "'C4-A1'",
  //                         "'O2-A1'",
  //                         "'LOC-A2'",
  //                         "'ROC-A1'",
  //                         "'Chin 1-Chin 2'",
  //                         "'ECG'",
  //                         "'Leg/L'",
  //                         "'Leg/R'",
  //                         "'Snore'",
  //                         "'Airflow'",
  //                         "'Nasal Pressure'",
  //                         "'Thor'",
  //                         "'Abdo'",
  //                         "'SpO2'",
  //                     ],
  //                 },
  //                 'ANNE':{
  //                     'ANNE': [
  //                         "'ECG'",
  //                         "'Accl Pitch'",
  //                         "'Accl Roll'",
  //                         "'Resp Effort'",
  //                         "'PAT(ms)'",
  //                         "'PAT_resp'",
  //                         "'Snore'",
  //                         "'SpO2(%)'",
  //                         "'Pleth'",
  //                         "'PAT_trend'",
  //                         "'HR(bpm)'",
  //                         "'Chest Temp(A C)'",
  //                         "'Limb Temp(A C)'",
  //                         // "'PR(bpm)'",
  //                         // "'PI(%)'",
  //                         // "'RR(rpm)'",
  //                     ],
  //                 }
  //             },
  //             channelGains: {
  //                 'MUSE + PSG': [
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                 ],
  //                 'PSG + ANNE': [
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                 ],
  //                 "Show all Signals": [
  //                     0,
  //                     //1,
  //                     //0.8,
  //                 //    0.10737418240000006,
  //                   //  1009.7419586828951,
  //                     //2.44140625
  //                     0.03051804379,
  //                     0.03051804379,
  //                     0.03051804379,
  //                     0.03051804379,
  //                     0.00003051804379,
  //                     0.00003051804379,
  //                     0.00003814755474,
  //                     0.0003051804379,
  //                     0.0003051804379
  //                 ],
  //                 "EEG + EOG + Chin EMG": [
  //                     1.5625,
  //                     2.44140625,
  //                     0.5120000000000001,
  //                     1009.741958682895
  //                 ],
  //                 'PSG': [
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                 ],
  //                 'ANNE': [
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                     1,
  //                 ],
  //             },
  //             staticFrequencyFiltersByDataModality: {
  //                 "'F4-A1'": { highpass: 0.3, lowpass: 35 },
  //                 "'C4-A1'": { highpass: 0.3, lowpass: 35 },
  //                 "'O2-A1'": { highpass: 0.3, lowpass: 35 },
  //                 "'Chin1-Chin2'": { highpass: 10, lowpass: 100 },
  //                 "'LOC-O2'": { highpass: 0.3, lowpass: 35 },
  //                 "'ECG'": { highpass: 0.3, lowpass: 70 },
  //                 "'Leg/L'": { highpass: 10, lowpass: 100 },
  //                 "'Leg/R'": { highpass: 10, lowpass: 100 },
  //                 "'Snore'": { highpass: 10, lowpass: 100 },
  //                 "'Airflow'": { highpass: 0.01, lowpass: 15 },
  //                 'Nasal Pressure': { highpass: 0.01, lowpass: 15 },
  //                 'Thor': { highpass: 0.01, lowpass: 15 },
  //                 'Abdo': { highpass: 0.01, lowpass: 15 },

  //                 "'EEG'": { highpass: 0.3, lowpass: 35 },
  //                 "'EOG'": { highpass: 0.3, lowpass: 35 },
  //                 "'EMG'": { highpass: 10, lowpass: 100 },
  //                 "'RESP'": { highpass: 0.01, lowpass: 15 },

  //                 "'A1'": { highpass: 0.3, lowpass: 35 },
  //                 "'A2'": { highpass: 0.3, lowpass: 35 },

  //                 "'ROC'": { highpass: 0.3, lowpass: 35 },

  //                 "'Chin 2'": { highpass: 10, lowpass: 100 },

  //                     //'SpO2',
  //             },
  //             frequencyFilters: [{
  //                 title: 'Notch',
  //                 type: 'notch',
  //                 options: [
  //                     {
  //                         name: '60 Hz',
  //                         value: 60,
  //                     },
  //                     {
  //                         name: '50 Hz',
  //                         value: 50,
  //                     },
  //                     {
  //                         name: 'off',
  //                         value: undefined,
  //                         default: true,
  //                     },
  //                 ],
  //             }],
  //             targetSamplingRate: 32,
  //             useHighPrecisionSampling: false,
  //             startTime: 0,
  //             windowSizeInSeconds: wsize,
  //             preloadEntireRecording: false,
  //             showReferenceLines: true,
  //             showSleepStageButtons: true,
  //             showChannelGainAdjustmentButtons: false,
  //             showBackToLastActiveWindowButton: false,
  //             showInputPanelContainer: false,
  //             showBookmarkCurrentPageButton: false,
  //             showFastForwardButton: false,
  //             showFastBackwardButton: false,
  //             graph: {
  //                 height: 530,
  //                 enableMouseTracking: true,
  //             },
  //             features: {
  //                 order: ['sleep_spindle', 'k_complex', 'rem', 'vertex_wave'],
  //                 options: {}
  //             }
  //         }
  //     });
  //     task = Tasks.findOne(taskId);
  //     //console.log('Created Task "' + taskName + '" (' + taskId + ')');
  // }

  // if(recordingPaths.length > 1) {
  //     let dataIds = [];
  //     let dataNames = '';
  //     recordingPaths.forEach((recordingPath) => {
  //         const recordingPathParts = recordingPath.path.split('/');
  //         const recordingFilename = recordingPathParts[recordingPathParts.length - 1];
  //         let data = Data.findOne({
  //             name: recordingFilename,
  //             type: 'EDF',
  //             path: recordingPath.path,
  //         });
  //         if (!data) return;
  //         dataIds.push(data._id);
  //         dataNames += data.name + ', ';
  //     });
  //     dataNames = dataNames.slice(0, -2);

  //     assignment = Assignments.findOne({
  //         users: testUser._id,
  //         task: taskId,
  //         dataFiles: dataIds,
  //     });
  //     if (!assignment) {
  //         const assignmentId = Assignments.insert({
  //             users: [ testUser._id ],
  //             task: taskId,
  //             dataFiles: dataIds,
  //             status: 'Pending',
  //             channelsDelayed: '',
  //         });
  //         //console.log('Created Assignment for Task "' + task.name + '", User "' + testUser.email + '" and Data "' + dataNames +'" (' + assignmentId + ')');
  //     }
  // }
  // else
  // {
  //     recordingPaths.forEach((recordingPath) => {
  //     const recordingPathParts = recordingPath.path.split('/');
  //     const recordingFilename = recordingPathParts[recordingPathParts.length - 1];
  //     let data = Data.findOne({
  //         name: recordingFilename,
  //         type: 'EDF',
  //         path: recordingPath.path,
  //     });
  //     if (!data) return;

  //     assignment = Assignments.findOne({
  //         users: testUser._id,
  //         task: taskId,
  //         dataFiles: [data._id],
  //     });
  //     if (!assignment) {
  //         const assignmentId = Assignments.insert({
  //             users: [ testUser._id ],
  //             task: taskId,
  //             dataFiles: [data._id],
  //             status: 'Pending',
  //             channelsDelayed: '',
  //         });
  //         //console.log('Created Assignment for Task "' + task.name + '", User "' + testUser.email + '" and Data "' + data.name + '" (' + assignmentId + ')');
  //     }
  // })}

module.exports = {userAccounts};