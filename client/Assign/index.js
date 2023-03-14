import { Assignments, Tasks, Data, Patients, PreferencesFiles, Preferences} from '/collections';
import { MaterializeModal } from '/client/Modals/modal.js'

Template.Assign.events({
    'autocompleteselect input.autoclear' (event, template, task) {
        $(event.currentTarget).val('');
    },
    'autocompleteselect input.task' (event, template, task) {
        template.selectedTask.set(task);
    },
    'autocompleteselect input.preferences'(event, template, preferences) {
        console.log(preferences);
        template.selectedPreferences.set(preferences);
    },
    'autocompleteselect input.data' (event, template, data) {
        const selectedData = template.selectedData.get();
        selectedData[data._id] = data;
        template.selectedData.set(selectedData);
    },
    'autocompleteselect input.assignee-to-copy-data-from' (event, template, user) {
        const selectedData = template.selectedData.get();
        const selectedAssigneesToCopyDataFrom = template.selectedAssigneesToCopyDataFrom.get();
        selectedAssigneesToCopyDataFrom[user._id] = user;
        template.selectedAssigneesToCopyDataFrom.set(selectedAssigneesToCopyDataFrom);
        const selectedAssigneesToCopyDataFromUsernames = Object.values(selectedAssigneesToCopyDataFrom).map(a => a.username);
        const selectedAssigneesToCopyDataFromIds = Object.values(selectedAssigneesToCopyDataFrom).map(a => a._id);
        const modalTransitionTimeInMilliSeconds = 300;

        MaterializeModal.confirm({
            title: 'Want to add another reader to your selection?',
            message: 'Your current selection: <b>' + selectedAssigneesToCopyDataFromUsernames.join(', ') + '</b>',
            submitLabel: '<i class="fa fa-undo left"></i> Add another reader.',
            closeLabel: 'Continue with current selection <i class="fa fa-arrow-right left"></i>',
            outDuration: modalTransitionTimeInMilliSeconds,
            callback (error, response) {
                if (error) {
                    alert(error);
                    return;
                }
                if (response.submit) {
                    $(event.currentTarget).focus();
                    return;
                }
                window.setTimeout(function() { MaterializeModal.form({
                    title: '',
                    bodyTemplate: 'addAllDataFromAssigneeForm',
                    submitLabel: '<i class="fa fa-check left"></i> Find Recordings',
                    closeLabel: '<i class="fa fa-times left"></i> Cancel',
                    outDuration: modalTransitionTimeInMilliSeconds,
                    callback (error, response) {
                        template.selectedAssigneesToCopyDataFrom.set({});
                        if (error) {
                            alert(error);
                            return;
                        }
                        if (!response.submit) return;
                        const r = response.value;
                        let assignments = Assignments.find({ users: { $in: selectedAssigneesToCopyDataFromIds } }).fetch();

                        if (r.ignoreAssignmentsAssociatedWithOtherTasks) {
                            const selectedTaskId = template.selectedTask.get()._id;
                            assignments = assignments.filter(assignment => assignment.task == selectedTaskId);
                        }

                        if (r.ignorePendingAssignments) {
                            assignments = assignments.filter(assignment => assignment.status != 'Pending');
                        }

                        if (r.ignoreInProgressAssignments) {
                            assignments = assignments.filter(assignment => assignment.status != 'In Progress');
                        }

                        if (r.ignoreCompletedAssignments) {
                            assignments = assignments.filter(assignment => assignment.status != 'Completed');
                        }

                        if (r.ignoreRecordingsShorterThan && r.recordingLengthInMinutesLowerLimit) {
                            assignments = assignments.filter((assignment) => {
                                const lengthInMinutes = Data.findOne(assignment.data).metadata.wfdbdesc.LengthInSeconds / 60.0;
                                return lengthInMinutes >= r.recordingLengthInMinutesLowerLimit;
                            });
                        }

                        if (r.ignoreRecordingsLongerThan && r.recordingLengthInMinutesUpperLimit) {
                            assignments = assignments.filter((assignment) => {
                                const lengthInMinutes = Data.findOne(assignment.data).metadata.wfdbdesc.LengthInSeconds / 60.0;
                                return lengthInMinutes <= r.recordingLengthInMinutesUpperLimit;
                            });
                        }

                        if (r.ignoreDataFromPatientsWithIDLowerThan && r.patientIDLowerLimit) {
                            assignments = assignments.filter((assignment) => {
                                const data = Data.findOne(assignment.data);
                                const patient = Patients.findOne(data.patient);
                                return patient.id >= r.patientIDLowerLimit;
                            });
                        }

                        if (r.ignoreDataFromPatientsWithIDGreaterThan && r.patientIDUpperLimit) {
                            assignments = assignments.filter((assignment) => {
                                const data = Data.findOne(assignment.data);
                                const patient = Patients.findOne(data.patient);
                                return patient.id >= r.patientIDUpperLimit;
                            });
                        }

                        let usersWithSameAssignments = {};
                        if (r.ignoreDataAlsoAssignedToOtherReaders) {
                            assignments = assignments.filter((assignment) => {
                                const othersAssignments = Assignments.find({
                                    users: { $nin: selectedAssigneesToCopyDataFromIds },
                                    dataFiles: assignment.dataFiles,
                                    task: assignment.task,
                                }).fetch().filter((othersAssignment) => {
                                    return !othersAssignment.users.every(user => Roles.userIsInRole(user, 'tester'));
                                });
                                othersAssignments.forEach(othersAssignment => {
                                    othersAssignment.users.forEach((userId) => {
                                        if (Roles.userIsInRole(userId, 'tester')) return;
                                        if (usersWithSameAssignments[userId]) {
                                            usersWithSameAssignments[userId].numRecordings += 1;
                                        }
                                        else {
                                            usersWithSameAssignments[userId] = {
                                                numRecordings: 1,
                                                user: Meteor.users.findOne(userId),
                                            };
                                        }
                                    });
                                });
                                return othersAssignments.length === 0;
                            });
                        }
                        usersWithSameAssignments = Object.values(usersWithSameAssignments);

                        let data = assignments.map(assignment => Data.findOne(assignment.data));
                        const dataDict = {};
                        data.forEach(d => dataDict[d._id] = d);
                        data = Object.values(dataDict);
                        const dataPaths = data.map(d => d.pathAndLengthFormatted());
                        let message = 'Your selection resulted in the following list of ' + data.length + ' recording(s):<br><br><ul><li>' + dataPaths.join('</li><li>') + '</li></ul>';
                        if (usersWithSameAssignments.length) {
                            message += '<br>One or more recordings were ignored because they were also assigned to one of: <b>' + usersWithSameAssignments.map((u) => { return u.user.username + '(' + u.numRecordings + ')' }).join(', ') + '</b>';
                        }
                        window.setTimeout(function() { MaterializeModal.confirm({
                            title: 'Confirm recordings',
                            message: message,
                            submitLabel: '<i class="fa fa-check left"></i> Add recordings to list',
                            closeLabel: '<i class="fa fa-times left"></i> Cancel',
                            outDuration: modalTransitionTimeInMilliSeconds,
                            callback (error, response) {
                                if (error) {
                                    alert(error);
                                    return;
                                }
                                if (!response.submit) {
                                    return;
                                }
                                data.forEach(d => selectedData[d._id] = d);
                                template.selectedData.set(selectedData);
                            },
                        }); }, modalTransitionTimeInMilliSeconds);
                    },
                }); }, modalTransitionTimeInMilliSeconds);
            },
        })
    },
    'click .assignees-to-copy-data-from .delete' (event, template) {
        const dataId = $(event.currentTarget).data('id');
        const selectedAssigneesToCopyDataFrom = template.selectedAssigneesToCopyDataFrom.get();
        delete selectedAssigneesToCopyDataFrom[dataId];
        template.selectedAssigneesToCopyDataFrom.set(selectedAssigneesToCopyDataFrom);
    },
    'click .data .delete' (event, template) {
        const dataId = $(event.currentTarget).data('id');
        const selectedData = template.selectedData.get();
        delete selectedData[dataId];
        template.selectedData.set(selectedData);
    },
    'autocompleteselect input.assignee' (event, template, user) {
        const selectedAssignees = template.selectedAssignees.get();
        selectedAssignees[user._id] = user;
        template.selectedAssignees.set(selectedAssignees);
    },
    'click .assignees .delete' (event, template) {
        const dataId = $(event.currentTarget).data('id');
        const selectedAssignees = template.selectedAssignees.get();
        delete selectedAssignees[dataId];
        template.selectedAssignees.set(selectedAssignees);
    },
    'click .btn.assign' (event, template) {
        const modalTransitionTimeInMilliSeconds = 300;
        MaterializeModal.form({
            title: '',
            bodyTemplate: 'assignSettingsForm',
            submitLabel: '<i class="fa fa-check left"></i> Preview Assignments',
            closeLabel: '<i class="fa fa-times left"></i> Cancel',
            outDuration: modalTransitionTimeInMilliSeconds,
            callback (error, response) {
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

                window.setTimeout(function() { MaterializeModal.confirm({
                    title: 'Confirm assignments',
                    message: 'Your selection resulted in the following list of assignments:<br><br>' + assignmentsFormatted,
                    submitLabel: '<i class="fa fa-check left"></i> Create Assignment(s)',
                    closeLabel: '<i class="fa fa-times left"></i> Cancel',
                    outDuration: modalTransitionTimeInMilliSeconds,
                    callback (error, response) {
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
                                console.log(preferencesAnnotatorConfig);
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
                        template.selectedAssigneesToCopyDataFrom.set({});
                        template.selectedPreferences.set(null);

                        if(matchingFiles){
                            window.setTimeout(function() { MaterializeModal.message({
                                title: 'Done!',
                                message: 'Your selected assignments have been created successfully.',
                                outDuration: modalTransitionTimeInMilliSeconds,
                            }); }, modalTransitionTimeInMilliSeconds);
                        }
                        
                    },
                }); }, modalTransitionTimeInMilliSeconds);
            },
        });
    },
});

Template.Assign.onCreated(function() {
    this.selectedTask = new ReactiveVar(false);
    this.selectedData = new ReactiveVar({});
    this.selectedAssignees = new ReactiveVar({});
    this.selectedAssigneesToCopyDataFrom = new ReactiveVar({});
    this.selectedPreferences = new ReactiveVar(null);
});

Template.Assign.helpers({
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
    preferencesAutoCompleteSettings(){
        console.log(Template.preferencesAutocomplete);
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
    task() {
        return Template.instance().selectedTask.get();
    },
    assigneesToCopyDataFrom() {
        return Object.values(Template.instance().selectedAssigneesToCopyDataFrom.get());
    },
    dataAutocompleteSettings() {
        return {
            limit: Number.MAX_SAFE_INTEGER,
            rules: [
                {
                    collection: Data,
                    field: 'name',
                    matchAll: true,
                    template: Template.dataAutocomplete
                }
            ]
        }
    },
    data() {
        return Object.values(Template.instance().selectedData.get());
    },
    numData() {
        return Object.keys(Template.instance().selectedData.get()).length;
    },
    singleUserAutocompleteSettings() {
        return {
            limit: Number.MAX_SAFE_INTEGER,
            rules: [
                {
                    collection: Meteor.users,
                    field: 'username',
                    matchAll: true,
                    template: Template.userAutocomplete
                }
            ]
        }
    },
    assignees() {
        return Object.values(Template.instance().selectedAssignees.get());
    },
});