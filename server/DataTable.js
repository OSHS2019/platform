import { Tabular } from "meteor/aldeed:tabular";
import { TaskNames, Data, Tasks, Assignments, Patients, PreferencesFiles, AlignmentFiles, AnnotationFiles} from '/collections';

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
            //let patient_id = Data.findOne({_id:val}).patient;
            //return Patients.findOne({_id:patient_id}).id;
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
            data.forEach((d) => {
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
        {title: "Manage Assignments",
          tmpl: Meteor.isClient && Template.manageButton},
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


TabularTables.PreferencesFiles = new Tabular.Table({
    name: "PreferencesFiles",
    collection: PreferencesFiles,
    columns: [
      {data: "name", title: "Name"},
      {data: "annotatorConfig", title: "Channels Required", 
      render:function(val){
        return Object.keys(val.scalingFactors).length;
      }},
      {title: "Delete",
        tmpl: Meteor.isClient && Template.deleteButtonPreferences},
      {title: "Selected", 
        tmpl: Meteor.isClient && Template.selectedPreferences}
      ],
    initComplete: function() {
      $('.dataTables_empty').html('processing');
    },
    processing: false,
    skipCount: true,
    pagingType: 'simple',
    infoCallback: (settings, start, end, total) => `Total: ${total}, Showing ${start} to ${end} `,
});

TabularTables.AlignmentFiles = new Tabular.Table({
  name: "AlignmentFiles",
  collection: AlignmentFiles,
  columns: [
    {data: "filename", title: "FileName"},
    {data: "file1", title: "File 1"},
    {data: "file2", title: "File 2"},
    {data: "lag", title: "Lag"},
    {title: "Delete",
      tmpl: Meteor.isClient && Template.deleteButtonAlignment},
    {title: "Selected", 
      tmpl: Meteor.isClient && Template.selectedAlignment}
    ],
  initComplete: function() {
    $('.dataTables_empty').html('processing');
  },
  processing: false,
  skipCount: true,
  pagingType: 'simple',
  infoCallback: (settings, start, end, total) => `Total: ${total}, Showing ${start} to ${end} `,
});

TabularTables.AnnotationFiles = new Tabular.Table({
  name: "AnnotationFiles",
  collection: AnnotationFiles,
  columns: [
    {data: "filename", title: "Filename"},
    {data: "annotations", title: "# of Annotations", 
    render:function(val){
      return Object.keys(val).length;
    }},
    {title: "Delete",
      tmpl: Meteor.isClient && Template.deleteButtonPreferences},
    {title: "Selected", 
      tmpl: Meteor.isClient && Template.selectedPreferences}
    ],
  initComplete: function() {
    $('.dataTables_empty').html('processing');
  },
  processing: false,
  skipCount: true,
  pagingType: 'simple',
  infoCallback: (settings, start, end, total) => `Total: ${total}, Showing ${start} to ${end} `,
});

TabularTables.TaskNames = new Tabular.Table({
  name: "TaskNames",
  collection: TaskNames,
  columns: [
      {data: "TaskName", title: "Task Name"},
      {title: "Delete",
      tmpl: Meteor.isClient && Template.deleteButtonTasks},
      {title: "Selected", 
      tmpl: Meteor.isClient && Template.selectedTasks}
    ],
    initComplete: function() {
      $('.dataTables_empty').html('processing');
    },
    processing: false,
    skipCount: true,
    pagingType: 'simple',
    infoCallback: (settings, start, end, total) => `Total: ${total}, Showing ${start} to ${end} `,
});