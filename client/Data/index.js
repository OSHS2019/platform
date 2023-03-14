import { PreferencesFiles, Preferences, Data, Tasks, Assignments, Patients} from '/collections';
import moment from 'moment';
import { MaterializeModal } from '/client/Modals/modal.js'
import { EDFFile } from '/collections';

import { Tabular } from "meteor/aldeed:tabular";
import { $ } from 'meteor/jquery';
import dataTablesBootstrap from 'datatables.net-bs';
import 'datatables.net-bs/css/dataTables.bootstrap.css';
import { connections } from 'mongoose';


// double dictionary for task inference
let taskDictionary = {};
let dataDictionary = {};
let page = 1;
let limit = 10;
let cond = {}
var selectedDataG = new ReactiveVar({});
var selectedAssigneesG = new ReactiveVar({});
var selectedTaskG = new ReactiveVar(false);
var loading = new ReactiveVar(false);
var selectedPreferencesG = new ReactiveVar(null);

let renderDate = (dateValue) => {
  if (dateValue instanceof Date) {
    return moment(dateValue).format('YYYY-MM-DD hh:mm');
  } else {
    return 'Never';
  }
}

let getSignalNameSet = (fileMetadata) => {
  let set = new Set();
  fileMetadata.Groups.forEach(element => {
    Object.keys(element.SignalsByName).forEach(element => {
      set.add(element);
    })
  });
  return set;
}

let assembleTaskObj = (signalNameSet, source, file) => {
  if (source === "Other") {
    // Create a task displaying all channels.
    let taskDocument = {
      name: "edf annotation from template: " + file,
      allowedDataTypes: ["EDF"],
      annotator: "EDF",
      annotatorConfig: {
        defaultMontage: source,
        channelsDisplayed: {
          "Other": {
            "Other": Array.from(signalNameSet).map(element => {
              return "'" + element + "'";
            })
          }
        },
        channelGains: {
          "Other": new Array(signalNameSet.size).fill(1)
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
        }, //
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
        windowSizeInSeconds: 30,
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
    }
    return taskDocument;

  }
}

let deleteFile = (fileName) => {
  return new Promise((resolve, reject) => {
    let patient = Patients.findOne({id:"Unspecified Patient - "+ fileName });
    if (patient) {
      let patient_id = patient["_id"];
      Patients.remove({_id:patient_id});
    }

    Meteor.call('removeFile',fileName,function(err,res){
      if (err){
        console.log(err);
        reject();
        return;
      }
      let selectedData = selectedDataG.get();
      delete selectedData[res];
      selectedDataG.set(selectedData);
      resolve();
    });
  });
};

let deleteAssignments = (dataId) => {
  let tasks = Assignments.find({}).fetch();
  console.log(dataId);
  console.log(tasks);
  return new Promise((resolve, reject) => {
    Meteor.call('deleteFromAssignments', dataId, function(res, err){
      if (err){
        console.log(err);
        reject();
        return;
      }
      resolve();
    });
  });
};

Template.Data.events({
  'click .btn.local': function () {
    const files = document.getElementById("File");
    const folderFiles = document.getElementById("Folder");

    const allFiles = Array.from(files.files).concat(Array.from(folderFiles.files).filter(fileObj => fileObj.name.split('.')[1].toLowerCase() === "edf"));

    window.alert(`You are uploading ${allFiles.length} file(s), press OK to proceed.\n\nPlease do not close this tab until you are notified that all uploading processes have terminated!`);

    let filesSuccessfullyUploaded = 0;
    let filesUploadFailed = "";
    let uploadsEnded = 0;
    loading.set(true);

    for (let i = 0; i < allFiles.length; i++) {
      const input = allFiles[i].name;
      console.log(input)
      console.log(files);
      const recordingPath = `/uploaded/${input}`;
      let promise = new Promise((resolve, reject) => {
        Meteor.call("get.edf.metadata", recordingPath,
          (error, results) => {
            if (error) {
              throw new Error("Cannot get recording metadata\n" + error);
            }
            return resolve(results);
          }
        );
      });

      promise.then(result => {
        console.log(result);
        var patientId = Patients.insert({
          id: "Unspecified Patient - " + input,
        });
        if(taskId = Tasks.findOne({name: "edf annotation from template: " + input})){
          // Data object creation
          console.log("here");
          console.log(taskId);
          var dataDocument = {
            name: input,
            type: "EDF",
            source: "Other",
            patient: patientId,
            path: recordingPath,
            metadata: { wfdbdesc: result },
            defaultTask: taskId._id,
          }
          var dataId = Data.insert(dataDocument);
          console.log(dataId);
          let signalNameSet = getSignalNameSet(result);
          let signalNameString = [...signalNameSet].join(' ');

          dataDictionary[dataId] = signalNameString;
        } else {
          let signalNameSet = getSignalNameSet(result);
          let signalNameString = [...signalNameSet].join(' ');
          let taskDocument = assembleTaskObj(signalNameSet, "Other", input);
          console.log(taskDocument);
          taskID = Tasks.insert(taskDocument);
          console.log(taskID);

          taskDictionary[signalNameString] = taskID;
          // Data object creation
          var dataDocument = {
            name: input,
            type: "EDF",
            source: "Other",
            patient: patientId,
            path: recordingPath,
            metadata: { wfdbdesc: result },
            defaultTask: taskID,
          };
          var dataId = Data.insert(dataDocument);
          console.log(dataId);
          dataDictionary[dataId] = signalNameString;
        }
        /*
        // Data object creation
        var dataDocument = {
          name: input,
          type: "EDF",
          source: "Other",
          patient: patientId,
          path: recordingPath,
          metadata: { wfdbdesc: result },
        }

        var dataId = Data.insert(dataDocument);
        console.log(dataId);

        let signalNameSet = getSignalNameSet(result);
        let signalNameString = [...signalNameSet].join(' ');

        dataDictionary[dataId] = signalNameString;

        let temp = taskDictionary[signalNameString];
        console.log(signalNameString);

        if (!temp) {
          let taskDocument = assembleTaskObj(signalNameSet, "Other", input, dataId);
          console.log(taskDocument);
          let taskID = Tasks.insert(taskDocument);
          console.log(taskID);

          taskDictionary[signalNameString] = taskID
        }
        */
        filesSuccessfullyUploaded++;
        // filesSuccessfullyUploadedString += 'inpu + "\n";
        uploadsEnded++;

        if (uploadsEnded === allFiles.length) {
          loading.set(false);
          window.alert(`${allFiles.length - filesSuccessfullyUploaded}/${allFiles.length} files failed to upload:\n${filesUploadFailed}\n\n$`);
        }

      })
    }

  },
  'click .btn.download': function () {
    loading.set(true);
    $(Template.instance().find('table')).table2csv();
    loading.set(false);
  },
  'click .btn.upload': function () {
    const files = document.getElementById("File");
    const folderFiles = document.getElementById("Folder");

    let allFilesUnfiltered = Array.from(files.files).concat(Array.from(folderFiles.files).filter(fileObj => fileObj.name.split('.')[1].toLowerCase() === "edf"));
    const allFiles = allFilesUnfiltered.filter((file, i) => {
      return allFilesUnfiltered.findIndex((e) => {
        return e.name === file.name;
      }) === i;
    });

    console.log(allFiles);

    window.alert(`You are uploading ${allFiles.length} file(s), press OK to proceed.\n\nPlease do not close this tab until you are notified that all uploading processes have terminated!`);

    let filesSuccessfullyUploaded = 0;
    let filesUploadFailed = "";
    let uploadsEnded = 0;
    let filesSuccessfullyUploadedString = "";
    let overwritePromise = false;
    let overwriteDuplicates = false;

    loading.set(true);

    for (let i = 0; i < allFiles.length; i++) {

      const input = allFiles[i];


      if (input) {
        const reader = new FileReader();

        reader.onload = function (e) {

          console.log("initiating file upload");
          console.log(EDFFile);

          // Since EDFFile is a promise, we need to handle it as such
          EDFFile.then(result => {
            let checkIfFileExists = new Promise((resolve, reject) => {
              Meteor.call("get.file.exists", input.name,
                (error, result) => {
                  if (error) {
                    throw new Error("Error checking file\n" + error);
                  }

                  if (result) {
                    if (!overwritePromise) {
                      overwritePromise = new Promise((oResolve, oReject) => {
                        const modalTransitionTimeInMilliSeconds = 300;
                        MaterializeModal.confirm({
                          title: 'Duplicate File',
                          message: 'Duplicate Files Detected. Overwrite?<br>',
                          submitLabel: '<i class="fa fa-check left"></i> Overwrite All Duplicates',
                          closeLabel: '<i class="fa fa-times left"></i> Ignore Duplicates',
                          outDuration: modalTransitionTimeInMilliSeconds,
                          callback(error, response) {
                            if (error) {
                              alert(error);
                              oReject(error);
                              reject(error);
                              return;
                            }
                            if (!response.submit) {
                              oResolve();
                              return;
                            }

                            overwriteDuplicates = true;
                            oResolve();
                          }
                        });
                      });
                    }

                    overwritePromise.then(() => {
                      if (overwriteDuplicates) {
                        deleteFile(input.name).then(() => {
                          resolve();
                        }).catch((err) => {
                          console.log(err);
                          reject(err);
                        });
                      } else {
                        reject("Duplicate file skipped.");
                        return;
                      }
                    });
                  } else {
                    resolve();
                  }
                }
              );
            });

            checkIfFileExists.then(() => {
              var uploadInstance = result.insert({
                file: input,
                chunkSize: 'dynamic',
                fileName: input.name
              }, false);
  
              uploadInstance.on('end', function (error, fileObj) {
                if (error) {
                  loading.set(false);
                  window.alert(`Error uploading ${fileObj.name}: ` + error.reason);
                  filesUploadFailed += fileObj.name + ": " + error.reason + "\n";
                  uploadsEnded++;
                  if (uploadsEnded === allFiles.length) {
                    loading.set(false);
                    window.alert(`${allFiles.length - filesSuccessfullyUploaded}/${allFiles.length} files failed to upload:\n${filesUploadFailed}\n\n${filesSuccessfullyUploaded}/${allFiles.length} files successfully uploaded:\n${filesSuccessfullyUploadedString}`);
                  }
                } else {
                  // window.alert('File "' + fileObj.name + '" successfully uploaded');
  
                  const recordingPath = `/uploaded/${uploadInstance.config.fileId}.edf`;
  
                  let promise = new Promise((resolve, reject) => {
                    Meteor.call("get.edf.metadata", recordingPath,
                      (error, results) => {
                        if (error) {
                          throw new Error("Cannot get recording metadata\n" + error);
                        }
  
                        return resolve(results);
                      }
                    );
                  });
  
                  promise.then(result => {
                    console.log(result);
                    var patientId = Patients.insert({
                      id: "Unspecified Patient - " + fileObj.name,
                    });

                    if(taskId = Tasks.findOne({name: "edf annotation from template: " + fileObj.name})){
                      // Data object creation
                      console.log("here");
                      console.log(taskId);
                      var dataDocument = {
                        name: fileObj.name,
                        type: "EDF",
                        source: "Other",
                        patient: patientId,
                        path: recordingPath,
                        metadata: { wfdbdesc: result },
                        defaultTask: taskId._id,
                      }
                      var dataId = Data.insert(dataDocument);
                      console.log(dataId);
                      let signalNameSet = getSignalNameSet(result);
                      let signalNameString = [...signalNameSet].join(' ');
  
                      dataDictionary[dataId] = signalNameString;
                    } else {
                      let signalNameSet = getSignalNameSet(result);
                      let signalNameString = [...signalNameSet].join(' ');
                      let taskDocument = assembleTaskObj(signalNameSet, "Other", fileObj.name);
                      console.log(taskDocument);
                      taskID = Tasks.insert(taskDocument);
                      console.log(taskID);
  
                      taskDictionary[signalNameString] = taskID;
                      // Data object creation
                      var dataDocument = {
                        name: fileObj.name,
                        type: "EDF",
                        source: "Other",
                        patient: patientId,
                        path: recordingPath,
                        metadata: { wfdbdesc: result },
                        defaultTask: taskID,
                      };
                      var dataId = Data.insert(dataDocument);
                      console.log(dataId);
                      dataDictionary[dataId] = signalNameString;
                    }
                    /*
                    // Data object creation
                    var dataDocument = {
                      name: fileObj.name,
                      type: "EDF",
                      source: "Other",
                      patient: patientId,
                      path: recordingPath,
                      metadata: { wfdbdesc: result },
                    }
  
                    var dataId = Data.insert(dataDocument);
                    console.log(dataId);
  
                    let signalNameSet = getSignalNameSet(result);
                    let signalNameString = [...signalNameSet].join(' ');
  
                    dataDictionary[dataId] = signalNameString;
  
                    let temp = taskDictionary[signalNameString];
                    console.log(signalNameString);
                    console.log(taskDictionary);
  
                    if (!temp) {
                      if(taskId = Tasks.findOne({name: "edf annotation from template: " + fileObj.name})){
                        taskDictionary[signalNameString] = taskId;
                      } else {
                        let taskDocument = assembleTaskObj(signalNameSet, "Other", fileObj.name, dataId);
                        console.log(taskDocument);
                        taskID = Tasks.insert(taskDocument);
                        console.log(taskID);
    
                        taskDictionary[signalNameString] = taskID;
                      }
                    }
                    */
                    filesSuccessfullyUploaded++;
                    filesSuccessfullyUploadedString += fileObj.name + "\n";
                    uploadsEnded++;
  
                    if (uploadsEnded === allFiles.length) {
                      loading.set(false);
                      window.alert(`${allFiles.length - filesSuccessfullyUploaded}/${allFiles.length} files failed to upload:\n${filesUploadFailed}\n\n${filesSuccessfullyUploaded}/${allFiles.length} files successfully uploaded:\n${filesSuccessfullyUploadedString}`);
                    }
  
                  })
  
  
                }
  
  
              });
  
              uploadInstance.start();
            }, (err) => {
              uploadsEnded++;
              filesUploadFailed += input.name + ": " + err + "\n";
  
              if (uploadsEnded === allFiles.length) {
                loading.set(false);
                window.alert(`${allFiles.length - filesSuccessfullyUploaded}/${allFiles.length} files failed to upload:\n${filesUploadFailed}\n\n${filesSuccessfullyUploaded}/${allFiles.length} files successfully uploaded:\n${filesSuccessfullyUploadedString}`);
              }
            });
          }).catch(error => {
            loading.set(false);
            console.log("Upload Process Failed: ", error);
          });


        };
        reader.readAsText(input);
      }
    }



  },
  'autocompleteselect input.task'(event, template, task) {
    console.log(task);
    template.selectedTask.set(task);
  },
  'autocompleteselect input.task'(event, template, task) {
    console.log(task);
    template.selectedTask.set(task);
  },
  'autocompleteselect input.preferences'(event, template, preferences) {
    console.log(preferences);
    template.selectedPreferences.set(preferences);
  },
  'click .change-page'(event, template) {
    template.change.set(false)
    console.log(document.getElementById('page'))
    page = parseInt(document.getElementById('page').value);
    console.log(document);
    limit = parseInt(document.getElementById('limit').value);
    cond = {};
    let patientId = document.getElementById('patientId') ? document.getElementById('patientId').value : null;
    let path = document.getElementById('path') ? document.getElementById('path').value : null;
    //console.log(path);
    if (patientId) cond["name"] = patientId;
    if (path) cond["path"] = path;
    //console.log(cond);
    console.log(template);
    Meteor.setTimeout(() => (template.change.set(true)), 1000);
  },
  'autocompleteselect input.assignee'(event, template, user) {
    const selectedAssignees = template.selectedAssignees.get();
    selectedAssignees[user._id] = user;
    template.selectedAssignees.set(selectedAssignees);
  },
  'click .assignees .delete'(event, template) {
    console.log(template.selectedAssignees.get());
    const dataId = $(event.currentTarget).data('id');
    const selectedAssignees = template.selectedAssignees.get();
    delete selectedAssignees[dataId];
    template.selectedAssignees.set(selectedAssignees);
  },
  'click .btn.assign'(event, template) {
    if (document.getElementById("alginment") && document.getElementById("alginment").checked === true) {
      const modalTransitionTimeInMilliSeconds = 300;
      MaterializeModal.form({
        title: '',
        bodyTemplate: 'assignSettingsForm',
        submitLabel: '<i class="fa fa-check left"></i> Preview Alignment',
        closeLabel: '<i class="fa fa-times left"></i> Cancel',
        outDuration: modalTransitionTimeInMilliSeconds,
        callback(error, response) {
          if (error) {
            alert(error);
            return;
          }
          if (!response.submit) return;

          const task = template.selectedTask.get();
          const data = Object.values(template.selectedData.get());
          const assigneesDict = template.selectedAssignees.get();
          const assignees = Object.values(template.selectedAssignees.get());
          console.log(assignees);
          console.log(data);

          const assignmentsByAssignee = {};
          assignees.forEach((assignee) => {
            const assignmentsForAssignee = []
            data.forEach((d) => {
              let doAssign = true;
              assignmentsForAssignee.push({
                doAssign: doAssign,
                data: d,
              });
            });
            assignmentsByAssignee[assignee._id] = assignmentsForAssignee;
            console.log(assignmentsByAssignee);
          });

          let assignmentsFormatted = '';
          Object.keys(assignmentsByAssignee).forEach((assigneeId) => {
            const assignee = assigneesDict[assigneeId];
            const assignments = assignmentsByAssignee[assigneeId];
            activeAssignments = assignments.filter(a => a.doAssign);
            assignmentsFormatted += '<b>' + assignee.username + '</b> (' + activeAssignments.length + '):<br><br><ul>';
            assignments.forEach((assignment) => {
              const dataPath = assignment.data.pathAndLengthFormatted();
              if (assignment.doAssign) {
                assignmentsFormatted += '<li><b>' + dataPath + '</b></li>';
              }
              else {
                assignmentsFormatted += '<li><strike>' + dataPath + '</strike></li>';
              }
            });
            assignmentsFormatted += '</ul>';
          });

          window.setTimeout(function () {
            MaterializeModal.confirm({
              title: 'Confirm assignments',
              message: 'Your selection resulted in the following list of assignments:<br><br>' + assignmentsFormatted,
              submitLabel: '<i class="fa fa-check left"></i> Create Alignment',
              closeLabel: '<i class="fa fa-times left"></i> Cancel',
              outDuration: modalTransitionTimeInMilliSeconds,
              callback(error, response) {
                if (error) {
                  alert(error);
                  return;
                }
                if (!response.submit) {
                  return;
                }
                var matchingFiles = true;
                const preferencesAnnotatorConfig = template.selectedPreferences.get() ? template.selectedPreferences.get().annotatorConfig : null;
                Object.keys(assignmentsByAssignee).forEach((assigneeId) => {
                  const assignments = assignmentsByAssignee[assigneeId];
                  var dataFiles = assignments.map((assignment) =>
                    assignment.data._id
                  );
                  if(preferencesAnnotatorConfig && matchingFiles){
                    // alignment has strictly 2 files
                    var numChannels1 = assignments[0].data.metadata.wfdbdesc.Groups[0].Signals.length;
                    var numChannels2 = assignments[1].data.metadata.wfdbdesc.Groups[0].Signals.length;
                    //console.log(numChannels);
                    var totalChannels = numChannels1 + numChannels2;
                    if(totalChannels != Object.keys(preferencesAnnotatorConfig.scalingFactors).length){
                      window.alert("Preferenes file does not match the files for this assignment. Please upload a different preferences file.");
                      matchingFiles = false;
                      return;
                    }
                  }

                  var obj = {
                    users: [assigneeId],
                    task: task._id,
                    dataFiles: dataFiles,
                    reviewer: Meteor.userId(),
                  }
                  var assignmentId = Assignments.insert(obj, function(err, docInserted){
                    if(err){
                      console.log(err);
                      console.log("error boy")
                      return;
                    }
                    console.log(docInserted._id);
                    assignmentId = docInserted._id;

                  });
                  console.log(assignmentId);
                  

                  if(preferencesAnnotatorConfig){
                    Preferences.insert({
                      assignment: assignmentId,
                      user: assigneeId,
                      dataFiles: dataFiles,
                      annotatorConfig: preferencesAnnotatorConfig,
                    })
                  }

                });


                template.selectedTask.set(false);
                template.selectedData.set({});
                template.selectedAssignees.set({});
                template.selectedPreferences.set(null);

                if(matchingFiles){
                  window.setTimeout(function () {
                    MaterializeModal.message({
                      title: 'Done!',
                      message: 'Your selected alignment have been created successfully.',
                      outDuration: modalTransitionTimeInMilliSeconds,
                    });
                  }, modalTransitionTimeInMilliSeconds);
                }
                
              },
            });
          }, modalTransitionTimeInMilliSeconds);
        },
      })
    } else {
      const modalTransitionTimeInMilliSeconds = 300;
      MaterializeModal.form({
        title: '',
        bodyTemplate: 'assignSettingsForm',
        submitLabel: '<i class="fa fa-check left"></i> Preview Assignments',
        closeLabel: '<i class="fa fa-times left"></i> Cancel',
        outDuration: modalTransitionTimeInMilliSeconds,
        callback(error, response) {
          if (error) {
            alert(error);
            return;
          }
          if (!response.submit) return;
          const r = response.value;

          const task = template.selectedTask.get();
          const data = Object.values(template.selectedData.get());
          const assigneesDict = template.selectedAssignees.get();
          const assignees = Object.values(template.selectedAssignees.get());

          const assignmentsByAssignee = {};
          assignees.forEach((assignee) => {
            const assignmentsForAssignee = []
            data.forEach((d) => {
              let doAssign = true;
              if (r.avoidDuplicateAssignmentsForIndividualReaders) {
                const duplicateAssignment = Assignments.findOne({
                  task: task._id,
                  users: assignee._id,
                  dataFiles: [d._id],
                });
                if (duplicateAssignment) {
                  doAssign = false;
                }
              }
              assignmentsForAssignee.push({
                doAssign: doAssign,
                data: d,
              });
            });
            assignmentsByAssignee[assignee._id] = assignmentsForAssignee;
          });

          let assignmentsFormatted = '';
          Object.keys(assignmentsByAssignee).forEach((assigneeId) => {
            const assignee = assigneesDict[assigneeId];
            const assignments = assignmentsByAssignee[assigneeId];
            activeAssignments = assignments.filter(a => a.doAssign);
            assignmentsFormatted += '<b>' + assignee.username + '</b> (' + activeAssignments.length + '):<br><br><ul>';
            assignments.forEach((assignment) => {
              const dataPath = assignment.data.pathAndLengthFormatted();
              if (assignment.doAssign) {
                assignmentsFormatted += '<li><b>' + dataPath + '</b></li>';
              }
              else {
                assignmentsFormatted += '<li><strike>' + dataPath + '</strike></li>';
              }
            });
            assignmentsFormatted += '</ul>';
          });

          window.setTimeout(function () {
            MaterializeModal.confirm({
              title: 'Confirm assignments',
              message: 'Your selection resulted in the following list of assignments:<br><br>' + assignmentsFormatted,
              submitLabel: '<i class="fa fa-check left"></i> Create Assignment(s)',
              closeLabel: '<i class="fa fa-times left"></i> Cancel',
              outDuration: modalTransitionTimeInMilliSeconds,
              callback(error, response) {
                if (error) {
                  alert(error);
                  return;
                }
                if (!response.submit) {
                  return;
                }

                var matchingFiles = true;
                const preferencesAnnotatorConfig = template.selectedPreferences.get() ? template.selectedPreferences.get().annotatorConfig : null;
                Object.keys(assignmentsByAssignee).forEach((assigneeId) => {
                  const assignee = assigneesDict[assigneeId];
                  const assignments = assignmentsByAssignee[assigneeId];
                  assignments.forEach((assignment) => {
                    if (!assignment.doAssign) return;

                    if(preferencesAnnotatorConfig && matchingFiles){
                      var numChannels = assignment.data.metadata.wfdbdesc.Groups[0].Signals.length;
                      console.log(numChannels);
                      if(numChannels != Object.keys(preferencesAnnotatorConfig.scalingFactors).length){
                        window.alert("Preferenes file does not match the file for this assignment. Please upload a different preferences file.");
                        matchingFiles = false;
                        return;
                      }
                    }
                    
                    // Given that only admins can access the Data tab we can just assign reviewer to the current admin user                    
                    var obj = {
                      users: [assigneeId],
                      task: task._id,
                      dataFiles: [assignment.data._id],
                      reviewer: Meteor.userId(),
                    }
                    var assignmentId = Assignments.insert(obj, function(err, docInserted){
                      if(err){
                        console.log(err);
                        console.log("error boy")
                        return;
                      }
                      console.log(docInserted._id);
                      assignmentId = docInserted._id;

                    });
                    console.log(assignmentId);
                    

                    if(preferencesAnnotatorConfig){
                      Preferences.insert({
                        assignment: assignmentId,
                        user: assigneeId,
                        dataFiles: [assignment.data._id],
                        annotatorConfig: preferencesAnnotatorConfig,
                      })
                    }
                    
                  });
                });

                template.selectedTask.set(false);
                template.selectedData.set({});
                template.selectedAssignees.set({});
                template.selectedPreferences.set(null);

                if(matchingFiles){
                  window.setTimeout(function () {
                    MaterializeModal.message({
                      title: 'Done!',
                      message: 'Your selected assignments have been created successfully.',
                      outDuration: modalTransitionTimeInMilliSeconds,
                    });
                  }, modalTransitionTimeInMilliSeconds);
                }
                
              },
            });
          }, modalTransitionTimeInMilliSeconds);
        },
      });
    }
  },
});



Template.Data.helpers({
  settings() {
    const selectedData = Template.instance().selectedData;
    console.log("start");
    console.log(Data);
    const data = Data.find(cond, { skip: (page - 1) * limit, limit:limit}).fetch();
    console.log(data);
    console.log(page);
    data.forEach((d) => {
      d.lengthFormatted = d.lengthFormatted();
      d.lengthInSeconds = d.lengthInSeconds();
      d.createdAt = renderDate(d.createdAt);
      d.updatedAt = renderDate(d.updatedAt);
      d.numAssignmentsNotCompleted = d.numAssignmentsNotCompleted();
      d.numAssignmentsInProgress = d.numAssignmentsInProgress();
      d.numAssignmentsPending = d.numAssignmentsPending();
      d.numAssignmentsCompleted = d.numAssignmentsCompleted();
      d.numAssignments = d.numAssignments();
      d.assigneeNames = d.assigneeNames();
      const patientDoc = d.patientDoc();
      if (patientDoc) {
        d.patientId = patientDoc.id;
        d.patientAge = patientDoc.age;
        d.patientSex = patientDoc.sex;
      }
    });
    fields = [
      {
        key: 'path',
        label: 'Path',
        sortOrder: 1,
        sortDirection: 'asc',
      },
      {
        key: 'lengthFormatted',
        label: 'Length (formatted)',
      },
      {
        key: 'lengthInSeconds',
        label: 'Length [seconds]',
        hidden: true,
      },
      {
        key: 'patientId',
        label: 'Patient #',
        sortOrder: 0,
        sortDirection: 'asc',
      },
      {
        key: 'patientAge',
        label: 'Age',
      },
      {
        key: 'patientSex',
        label: 'Sex',
      },
      {
        key: 'numAssignments',
        label: '# Assignments',
      },
      {
        key: 'numAssignmentsCompleted',
        label: '# Assignments Completed',
      },
      {
        key: 'numAssignmentsNotCompleted',
        label: '# Assignments Not Completed',
        hidden: true,
      },
      {
        key: 'numAssignmentsInProgress',
        label: '# Assignments In Progress',
        hidden: true,
      },
      {
        key: 'numAssignmentsPending',
        label: '# Assignments Pending',
        hidden: true,
      },
      {
        key: 'assigneeNames',
        label: 'Assignees',
      },
      {
        key: 'capturedAt',
        label: 'Captured',
        sortOrder: 2,
        sortDirection: 'asc',
      },
      {
        key: 'createdAt',
        label: 'Created',
        hidden: true,
      },
      {
        key: 'updatedAt',
        label: 'Last Updated',
        hidden: true,
      },
      //CODE FOR THE DELETE COLUMN IN FILES REACTIVE TABLE
      {
        key: 'DELETE',
        label: 'DELETE',
        fn: (value, object, key) => {
          const inputId = object._id;
          return new Spacebars.SafeString('<button type = "button" class = "btn delete-button" data-id = ' + inputId + ' = >DELETE</button>');
        }
      },
      //END OF CODE FOR THE DELETE COLUMN IN FILES REACTIVE TABLE
      {
        key: 'selectFn',
        label: 'Selected',
        fn: (value, object, key) => {
          const inputId = 'select-data-' + object._id;
          let checkedString = '';
          if (selectedData.get()[object._id]) {
            checkedString = ' checked="checked"';
          }
          return new Spacebars.SafeString('<input type="checkbox"' + checkedString + ' class="select-data" id="' + inputId + '" data-id="' + object._id + '"><label for="' + inputId + '"></label>');
        }
      },
    ];
    return {
      collection: data,
      showColumnToggles: true,
      showRowCount: true,
      rowsPerPage: limit,
      rowClass: function (data) {
        if (selectedData.get()[data._id]) {
          return 'selected-data ';
        }
        else if (data.numAssignmentsCompleted > 0) {
          return 'green lighten-4';
        }
        else if (data.numAssignmentsInProgress > 0) {
          return 'yellow lighten-4';
        }
        else if (data.numAssignmentsPending > 0) {
          return 'blue lighten-4';
        }
        return '';
      },
      filters: [
        'filterDataPath',
        'filterPatientId',
        'filterPatientAge',
        'filterNumAssignments',
      ],
      fields: fields,
    };
  },
  filterFieldsDataPath: ['path'],
  filterFieldsPatientId: ['patientId'],
  filterFieldsPatientAge: ['patientAge'],
  filterFieldsNumAssignments: ['numAssignments'],
  data() {
    return Object.values(Template.instance().selectedData.get());
  },
  loading(){
    //console.log(Template.instance());
    return Template.instance().loading.get();
  },
  preferencesAutoCompleteSettings(){
    console.log(PreferencesFiles.find());
    console.log(Data.find())
    return {
      limit: Number.MAX_SAFE_INTEGER,
      rules: [
        {
          collection: PreferencesFiles,
          field: 'name',
          matchAll: true,
          template: Template.preferencesAutocomplete,
        }
      ]
    }
  },
  preferences(){
    return Template.instance().selectedPreferences.get();
  },
  taskAutocompleteSettings() {
    return {
      limit: Number.MAX_SAFE_INTEGER,
      rules: [
        {
          collection: Tasks,
          field: 'name',
          matchAll: true,
          template: Template.taskAutocomplete
        }
      ]
    }
  },
  task() {
    return Template.instance().selectedTask.get();
  },
  singleUserAutocompleteSettings() {
    return {
      limit: Number.MAX_SAFE_INTEGER,
      rules: [
        {
          collection: Meteor.users,
          field: 'username',
          matchAll: true,
          template: Template.userAutocomplete,
        }
      ]
    }
  },
  assignees() {
    console.log(Template.instance().selectedAssignees.get());
    return Object.values(Template.instance().selectedAssignees.get());
  },
  changePage() {
    return Template.instance().change.get();
  },
  align() {
    console.log(Object.values(Template.instance().selectedData.get()).length === 2)
    return Object.values(Template.instance().selectedData.get()).length === 2;
  },
  getPage() {
    return page;
  },
  getLimit() {
    return limit;
  },
  getPatientID: function(){
    console.log(this);
    return "unspecified";
  }
});

Template.Data.events({
  'change .data .reactive-table tbody input[type="checkbox"].select-data': function (event, template) {
    const target = $(event.target);
    const isSelected = target.is(':checked');
    const dataId = target.data('id');
    const selectedData = template.selectedData.get();
    console.log(selectedData);
    console.log(template)
    if (isSelected) {
      const data = Data.findOne(dataId);
      selectedData[dataId] = data;

      let signalNameString = dataDictionary[dataId];
      // console.log(signalNameString);
      // console.log(dataDictionary);
      // console.log(dataId);
      if (signalNameString) {
        let taskId = taskDictionary[signalNameString];
        console.log(taskId);
        console.log(taskDictionary);
        if (taskId) {
          const task = Tasks.findOne(taskId);
          // console.log(task);
          template.selectedTask.set(task);
        }
      }
      let user = Meteor.user();

      console.log(user);

      let selectedAssignees = template.selectedAssignees.get();
      selectedAssignees[user._id] = user;
      template.selectedAssignees.set(selectedAssignees);

    }
    else {
      delete selectedData[dataId];
    }
    template.selectedData.set(selectedData);
  },
  /*
    'click .delete-button':function(event,template){
    const target = $(event.target);
    const dataId = target.data('id');
    const alldata = Data.findOne({_id:dataId},{fields:{name:1}});

    const file_name = alldata["name"];

    deleteFile(file_name);
  }
  */
  
  
});

// Note here we have the new Table
// Given that we need different templates to render the delete and select button, we have 
// new template events for deleting and selecting.
// Thus all new changes must appear in these events for the new table
// Note that the TabularTables.Data code needs to be in both server and client (idk why either)

TabularTables = {};
Meteor.isClient && Template.registerHelper('TabularTables',TabularTables);

  TabularTables.Data = new Tabular.Table({
    name: "Data",
    collection: Data,
    columns: [
      {data: "name", title: "Name",
        render:function(val, type, row) {
          if (type === 'display') {
            const data = Data.find({_id: row._id}).fetch();
            let path = "";
            data.forEach((d) => {
              path = d.path;
            });
            let pathEnd = path != null ? path.lastIndexOf("/") : -1;
            return pathEnd === -1 ? val : path.substring(0, pathEnd + 1) + val;
          } else {
            return val;
          }
        }},
      {data: "metadata.wfdbdesc.Length", title: "Length",
        render:function(val){
          return val.split(" ")[0];
        }},
      {data: "_id", title: "Patient #", searchable: false,
        render:function(val){
          const data = Data.find({_id: val}).fetch();
          let patientNum = "";
          //Note there will only be one element for forEach is not a big deal
          data.forEach((d)=> {
            patientNum = d.patientDoc().id;
          })
          return patientNum;
        }},
      {data: "_id", title: "# Assignments", searchable: false, 
        render:function(val){
          if(val){
            const data = Data.find({_id: val}).fetch();
            let numAssignments = 0;
            data.forEach((d) => {
              numAssignments = d.numAssignments()
            })
            return numAssignments;
          }
        }},
        {data: "_id", title: "# Assignments Completed", searchable: false, 
        render:function(val){
          const data = Data.find({_id: val}).fetch();
          let numAssignmentsCompleted = 0;
          data.forEach((d) => {fetch
            numAssignmentsCompleted = d.numAssignmentsCompleted()
          })
          return numAssignmentsCompleted;
        }},
        {data: "_id", title: "Assignees", searchable: false, 
        render:function(val){
          const data = Data.find({_id: val}).fetch();
          let assignees = [];
          data.forEach((d) => {
            assignees = d.assigneeNames()
          })
          return assignees;
        }},
      {title: "Delete",
        tmpl: Meteor.isClient && Template.deleteButton},
      {title: "Selected", 
        tmpl: Meteor.isClient && Template.selected}
    ],
    initComplete: function() {
      $('.dataTables_empty').html('processing');
    },
    processing: false,
    skipCount: true,
    pagingType: 'simple',
    infoCallback: (settings, start, end, total) => `Total: ${total}, Showing ${start} to ${end} `,
});

Template.selected.helpers({
  id(){
    return this._id;
  },
  isChecked() {
    let selectedData = selectedDataG.get();
    return selectedData[this._id] != null;
  }
});

Template.selected.events({
  'change .select-data': function (event, template) {
    const target = $(event.target);
    const isSelected = target.is(':checked');
    //const dataId = target.data('id');
    const dataId = this._id;
    console.log(this);
    let selectedData = selectedDataG.get();
    //const selectedData = template.selectedData.get();
    //console.log(Template.Data)
    //const selectedData = Template.Data.selectedData.get();
    console.log(Template.Data);
    if (isSelected) {
      const data = Data.findOne(dataId);
      console.log(data);
      selectedData[dataId] = data;
      let taskId = data.defaultTask;
      if (taskId) {
        const task = Tasks.findOne(taskId);
        // console.log(task);
        selectedTaskG.set(task);
      } else if ((Tasks.findOne({name: "edf annotation from template: " + data.name}))){
        const task = Tasks.findOne({name: "edf annotation from template: " + data.name});
        data.defaultTask = task;
        selectedTaskG.set(task);
        console.log(data);
      }

      //let signalNameString = dataDictionary[dataId];
      //console.log(dataDictionary);
      // console.log(signalNameString);
      // console.log(dataDictionary);
      // console.log(dataId);
      /*
      if (signalNameString) {
        let taskId = taskDictionary[signalNameString];
        console.log(taskId);
        console.log(taskDictionary);
        if (taskId) {
          const task = Tasks.findOne(taskId);
          // console.log(task);
          selectedTaskG.set(task);
        }
      }
      */
      let user = Meteor.user();

      console.log(user);

      /*
      let selectedAssignees = template.selectedAssignees.get();
      selectedAssignees[user._id] = user;
      template.selectedAssignees.set(selectedAssignees); 
      */
      let selectedAssignees = selectedAssigneesG.get();
      selectedAssignees[user._id] = user;
      //template.selectedAssignees.set(selectedAssignees);
      selectedAssigneesG.set(selectedAssignees);
      console.log(selectedAssigneesG.get());

    }
    else {
      delete selectedData[dataId];
    }
    selectedDataG.set(selectedData);
  }
});

Template.deleteButton.events({
  'click .delete-button': function(event,template){
    
    //const target = $(event.target);
    //console.log(target);
    console.log(this);
    console.log(this.id);
    //const dataId = target.data('id');
    const dataId = this._id;

    // So that the user knows they cannot delete the original files needed for CROWDEEG to Run
    // I am struggling to make the row for these two blue like the original
    console.log(this);
    if(this.path === "/physionet/edfx/PSG.edf" || this.path === "/physionet/edfx/ANNE.edf"){
      window.alert("You cannot delete " + this.path + " since it is needed for the app to run");
    } else {
      console.log(dataId);
      //const data = Data.findOne(dataId);
      //console.log(data);
      const alldata = Data.findOne({_id:dataId},{fields:{name:1}});
      console.log(alldata);
  
      const file_name = alldata["name"];
      deleteFile(file_name);
      console.log(taskDictionary);


      /*try{
        Data.remove(dataId);
        console.log("Removed from data");
      } catch(error){
        console.log("Not removed from DATA");
        console.log("ERROR: " + error);
      }*/
  

      // This is the old way of deleting before Dawson's fix
      /*
      const patients = Patients.findOne({id:"Unspecified Patient - "+ file_name });
    
      const patient_id = Patients.findOne({id:"Unspecified Patient - "+ file_name })["_id"];
      console.log(patient_id);
      console.log(file_name);
      try{
        Patients.remove({_id:patient_id});
        console.log("Successfully removed from Patients");
      } catch(error){
        console.log("Not removed from Patients");
        console.log("ERROR: " + error);
      }
      
      
  
      try{
        Data.remove(dataId);
        console.log("Removed from data");
      } catch(error){
        console.log("Not removed from DATA");
        console.log("ERROR: " + error);
      }
  
      var file_id = file_name.split(".")[0];
      file_id = file_id.trim();
      console.log(file_id)
    
      Meteor.call('removeFile',file_name,function(err,res){
        if (err){
          console.log(err);
        }
      })
      */
    }
    
    
  }
});

// Tabular does not do well with parent-child relationships with the ReactiveVars so global variable had to be made
Template.Data.onCreated(function () {
  this.selectedTask = selectedTaskG;
  this.selectedData = selectedDataG;
  this.selectedAssignees = selectedAssigneesG;
  this.selectedPreferences = selectedPreferencesG;
  this.change = new ReactiveVar(true);
  this.align = new ReactiveVar(true);
  this.loading = loading;
  //console.log(Data.find());
  //console.log(this);
});

Template.selected.onCreated(function(){
  this.change = new ReactiveVar(true);
  this.align = new ReactiveVar(true);
  this.loading = loading;
});
