import { TaskNames, PreferencesFiles, Preferences, Data, Tasks, Assignments, Patients, AnnotationFiles, AlignmentFiles, Annotations} from '/collections';
import moment from 'moment';
import { MaterializeModal } from '/client/Modals/modal.js'
import { EDFFile } from '/collections';

import { Tabular } from "meteor/aldeed:tabular";
import { $ } from 'meteor/jquery';
import dataTablesBootstrap from 'datatables.net-bs';
import 'datatables.net-bs/css/dataTables.bootstrap.css';
import { connections } from 'mongoose';

TabularTables = {};
var selectedDataG = new ReactiveVar({});

Meteor.isClient && Template.registerHelper('TabularTables', TabularTables);

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


Template.createTask.events({
    'click .create-button': function(event,template){
        // Task name should not be empty string
        if (document.getElementsByClassName('taskName')[0].value === ""){
            alert("Please enter a task name.");
        } else{
            Meteor.call("addTask", document.getElementsByClassName('taskName')[0].value);
            alert("Task added!");
        }
    }
})

// Faulty attept
// Template.Tasks.helpers({
//     tasks(){ 
//         // Call backend async
//         // Meteor.call("getTask", (err, result)=>{
//         //     let data = result;
//         //     let tasks = [];
//         //     for (item in data){
//         //         let value = data[item];
//         //         tasks.push({text: value['TaskName']});
//         //     }   
//         //     console.log(tasks);
//         //     return;
//         // }); 
//         tasks = [];
//         let tasks2 = TaskNames.find({}).fetch();
//         console.log(tasks2);
//         for (let i = 0; i < tasks2.length; i++) { 
//             tasks.push({text: tasks2[i].TaskName});
//         }
//         console.log(tasks);
//         return tasks;
//     }
// })



Template.selectedTasks.helpers({
    id(){
      return this._id;
    },
    isChecked() {
      let selectedData = selectedDataG.get();
      return selectedData[this._id] != null;
    }
  });

  Template.deleteButtonTasks.events({
    'click .delete-button': function(event,template){
      
      console.log(this);
      console.log(this._id);
      //const dataId = target.data('id');
      const dataId = this._id;
    // since we only have to deal with one collection we can simply do a try/catch without
    // any crazy conditions or checks
      try{
        TaskNames.remove(dataId);
      } catch(err){
        console.log(err);
      }
    }
  });

// Faulty Attept
// Template.task.events({
//     'click .delete': function(event,template){
//         console.log(this);
//         console.log(this._id);
//         const dataId = this._id;
//         console.log(dataId);
//         try{
//             TaskNames.remove(dataId);
//           } catch(err){
//             console.log(err);
//           }
//       }
//   });