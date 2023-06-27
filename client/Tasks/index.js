import { PreferencesFiles, Preferences, Data, Tasks, Assignments, Patients, AnnotationFiles, AlignmentFiles, Annotations} from '/collections';
import moment from 'moment';
import { MaterializeModal } from '/client/Modals/modal.js'
import { EDFFile } from '/collections';

import { Tabular } from "meteor/aldeed:tabular";
import { $ } from 'meteor/jquery';
import dataTablesBootstrap from 'datatables.net-bs';
import 'datatables.net-bs/css/dataTables.bootstrap.css';
import { connections } from 'mongoose';


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

Template.Tasks.helpers({
    tasks(){ 
        let tasks = [{text: "1"}, {text:"2"}, {text: "3"}]
        // Call backend async
        Meteor.call("getTask", (err, result)=>{
            let data = result;
            let tasks = [];
            for (item in data){
                let value = data[item];
                tasks.push({text: value['TaskName']});
            }   
            console.log(tasks);
            return;
        });
        console.log(tasks);
        return tasks;
    }
})