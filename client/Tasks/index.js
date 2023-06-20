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
            alert("Please enter a task name");
        } else{
            alert(document.getElementsByClassName('taskName')[0].value);
            Meteor.call("addTask", document.getElementsByClassName('taskName')[0].value);
        }
    }
})