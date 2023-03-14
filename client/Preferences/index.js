import { Data, Tasks, Assignments, Patients, PreferencesFiles} from '/collections';
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
var selectedPreferencesG = new ReactiveVar({});
console.log(PreferencesFiles.find())
console.log(Data.find());

Template.Preferences.events({
    'click .btn.upload': function () {
        const files = document.getElementById("File");
        const folderFiles = document.getElementById("Folder");
    
        let allFilesUnfiltered = Array.from(files.files).concat(Array.from(folderFiles.files).filter(fileObj => fileObj.name.split('.')[1].toLowerCase() === "json"));
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
    
        //loading.set(true);
    
        
        for(i=0; i< allFiles.length; i++){
            console.log(allFiles[i]);
            const file = allFiles[i];
            const fileName = file.name;
            var reader = new FileReader();
            reader.onload = function(e){
                const text = e.target.result;
                const data = JSON.parse(text);
                console.log(data);
                var check = PreferencesFiles.findOne({"name" : fileName});
                if(check != undefined){
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

                    overwritePromise.then(() => {
                      if (overwriteDuplicates) {
                        try{
                            PreferencesFiles.remove(check._id);
                            PreferencesFiles.insert({"name": fileName, "annotatorConfig": data});
                        } catch (err){
                            console.log(err);
                            window.prompt("There has been an error, please try again");
                        }
                      } else {
                        return;
                      }
                    });
                } else {
                    PreferencesFiles.insert({"name": fileName, "annotatorConfig": data});
                }
            }
            // need this or the onload wont work
            reader.readAsText(file);
        }
        selectedPreferencesG.set({});
    },
    'click .btn.download': function(){
      console.log("hellp");
      var allPreferences = selectedPreferencesG.get();
      if(Object.keys(allPreferences).length < 1){
        window.alert("No Preferences Selected To Download");
      } else {
        Object.values(allPreferences).forEach((item)=>{
          var annotatorConfigObj = item.annotatorConfig;
          console.log(item);
          var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(annotatorConfigObj));
          var downloadAnchorNode = document.createElement('a');
          downloadAnchorNode.setAttribute("href", dataStr);
          let fileName = item.name;
          downloadAnchorNode.setAttribute("download", fileName);
          document.body.appendChild(downloadAnchorNode); // required for firefox
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
        });

      }
    }
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


Template.selectedPreferences.helpers({
    id(){
      return this._id;
    },
    isChecked() {
      let selectedData = selectedDataG.get();
      return selectedData[this._id] != null;
    }
  });
  
  Template.selectedPreferences.events({
    'change .select-prefereneces': function (event, template) {
      const target = $(event.target);
      const isSelected = target.is(':checked');
      const id = this._id;
      console.log(this);
      let selectedPreferences = selectedPreferencesG.get();
      //console.log(Template.Data);
      if (isSelected) {
        const preferenece = PreferencesFiles.findOne(id);
        console.log(preferenece);
        selectedPreferences[id] = preferenece;
  
        let user = Meteor.user();
  
        console.log(user);
  
      }
      else {
        delete selectedPreferences[id];
      }
      selectedPreferencesG.set(selectedPreferences);
      console.log(selectedPreferencesG.get());
    }
  });
  
  Template.deleteButtonPreferences.events({
    'click .delete-button': function(event,template){
      
      console.log(this);
      console.log(this._id);
      //const dataId = target.data('id');
      const dataId = this._id;
    // since we only have to deal with one collection we can simply do a try/catch without
    // any crazy conditions or checks
      try{
        PreferencesFiles.remove(dataId);
      } catch(err){
        console.log(err);
      }
      
      
    }
  });
  
  // Tabular does not do well with parent-child relationships with the ReactiveVars so global variable had to be made
  Template.Preferences.onCreated(function () {
    this.selectedPreferences = selectedPreferencesG;
  });
  
  Template.selectedPreferences.onCreated(function(){
  });