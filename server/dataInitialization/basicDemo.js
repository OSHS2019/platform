import { Patients, Data, Tasks, Assignments, Annotations, Preferences } from '/collections';

const userAccounts = {
    'ADMIN': {
        username: 'Admin User',
        email: 'admin@example.com',
        password: 'changeme1234',
        roles: {
            '__global_roles__': [ 'admin' ],
        },
    },
    'TEST': {
        username: 'Test User',
        email: 'test@example.com',
        password: 'test',
        roles: {
            '__global_roles__': [ 'tester' ],
        },
    },
}
const rootUser = userAccounts['ADMIN'];
const testUser = userAccounts['TEST'];

const recordingPaths = [
   //'/physionet/edfx/SC4001E0-PSG.edf',
    '/physionet/edfx/200930_761428_ANNE.edf',
    '/physionet/edfx/200930_761428_PSGfiltered.edf'
];

Meteor.startup(() => {
    for (let userName in userAccounts) {
        const user = userAccounts[userName];
        const userDoc = Accounts.findUserByEmail(user.email);
        
        if (userDoc) {
            user._id = userDoc._id;
        }
        else {
            user._id = Accounts.createUser({
                username: user.username,
                email: user.email,
                password: user.password,
            });
            if (user.roles) {
                for (var group in user.roles) {
                    Roles.addUsersToRoles(user._id, user.roles[group], group);
                }
            }
            console.log('Created user account "' + user.username + '", "' + user.email + '" (' + user._id + ')');
        }
    }

    const taskName = 'Sleep Staging (Physionet EDFX)28';
    
    let task = Tasks.findOne({ name: taskName });
    let taskId;
    if (task) {
        taskId = task._id;
    }
    if (!task) {
        var wsize = 30;	
        if(taskName.includes("ANNE") || taskName.includes("MUSE")){
            wsize = 300;
        }
        taskId = Tasks.insert({
            name: taskName,
            allowedDataTypes: ['EDF'],
            annotator: 'EDF',
            annotatorConfig: {
                defaultMontage: 'Psg + Anne',
                channelsDisplayed: {
                    'Show all Signals': [
                       // "'Pleth'",
                        "'Snore'",
                        "'Nasal Pressure'",
                        "'Thor'",
                        "'ECG'",
                        "'F4-A1'",
                        "'C4-A1'",
                        "'ECG'",
                        "'Leg/L'",
                        "'Airflow'",
                       
                        
                        //'Accl Pitch',
                        //'pcg',
//
                    ],
                    'PSG + Anne Annotation': [
                        "'ECG'",
                        "'Pleth'",
                        "'Accl Pitch'",
                        "'Accl Roll'",
                        "'Resp Effort'",
                        "'PAT(ms)'",
                        "'PR(bpm)'",
                        //"'PAT_resp'",
                        "'Snore'",
                        //"'PAT_trend'",
                        "'PI(%)'",
                        "'HR(bpm)'",
                        "'RR(rpm)'",
                        "'SpO2(%)'",
                       "'Chest Temp(A C)'",
                        "'Limb Temp(A C)'",
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
                    'PSG Annotation':[
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
                    'Anne Annotation':[
                        "'ECG'",
                        "'Pleth'",
                        "'Accl Pitch'",
                        "'Accl Roll'",
                        "'Resp Effort'",
                        "'PAT(ms)'",
                        "'PR(bpm)'",
                        //"'PAT_resp'",
                        "'Snore'",
                        //"'PAT_trend'",
                        "'PI(%)'",
                        "'HR(bpm)'",
                        "'RR(rpm)'",
                        "'SpO2(%)'",
                       "'Chest Temp(A C)'",
                        "'Limb Temp(A C)'",
                                            ]
                    


                },
                channelGains: {
                    "Show all Signals": [
                        0,
                        //1,
                        //0.8,
                    //    0.10737418240000006,
                      //  1009.7419586828951,
                        //2.44140625
                        0.03051804379,
                        0.03051804379,
                        0.03051804379,
                        0.03051804379,
                        0.00003051804379,
                        0.00003051804379,
                        0.00003814755474,
                        0.0003051804379,
                        0.0003051804379
                    ],
                    "EEG + EOG + Chin EMG": [
                        1.5625,
                        2.44140625,
                        0.5120000000000001,
                        1009.741958682895
                    ],
                    "PSG Annotation": [
                     1,
                     1,
                     1,
                     1,
                     1,
                     1,
                     1,
                     1,
                     1,
                     1,
                     1,
                     1,
                     1,
                     1

                    ],
                    "Anne Annotation": [
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1
   
                       ],
                       "PSG + Anne Annotation": [
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1,
                        1
   
                       ],

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
                    'Nasal Pressure': { highpass: 0.01, lowpass: 15 },
                    'Thor': { highpass: 0.01, lowpass: 15 },
                    'Abdo': { highpass: 0.01, lowpass: 15 },

                    "'EEG'": { highpass: 0.3, lowpass: 35 },
                    "'EOG'": { highpass: 0.3, lowpass: 35 },
                    "'EMG'": { highpass: 10, lowpass: 100 },
                    "'RESP'": { highpass: 0.01, lowpass: 15 },
                    
                    
                    "'A1'": { highpass: 0.3, lowpass: 35 },
                    "'A2'": { highpass: 0.3, lowpass: 35 },
                    
                    
                    "'ROC'": { highpass: 0.3, lowpass: 35 },
                    
                    "'Chin 2'": { highpass: 10, lowpass: 100 },
                    
                    
                    
                    
                    
                    
                        //'SpO2',
                },
                frequencyFilters: [{
                    title: 'Notch',
                    type: 'notch',
                    options: [
                        {
                            name: '60 Hz',
                            value: 60,
                        },
                        {
                            name: '50 Hz',
                            value: 50,
                        },
                        {
                            name: 'off',
                            value: undefined,
                            default: true,
                        },
                    ],
                }],
                targetSamplingRate: 32,
                useHighPrecisionSampling: false,
                startTime: 0,
                windowSizeInSeconds: wsize,
                preloadEntireRecording: false,
                showReferenceLines: true,
                showSleepStageButtons: true,
                showChannelGainAdjustmentButtons: false,
                showBackToLastActiveWindowButton: false,
                showInputPanelContainer: false,
                showBookmarkCurrentPageButton: false,
                showFastForwardButton: false,
                showFastBackwardButton: false,
                graph: {
                    height: 530,
                    enableMouseTracking: true,
                },
                features: {
                    order: ['sleep_spindle', 'k_complex', 'rem', 'vertex_wave'],
                    options: {}
                }
            }
        });
        task = Tasks.findOne(taskId);
        console.log('Created Task "' + taskName + '" (' + taskId + ')');
    }

    recordingPaths.forEach((recordingPath) => {
    	const recordingPathParts = recordingPath.split('/');
        const recordingFilename = recordingPathParts[recordingPathParts.length - 1];
        let data = Data.findOne({
            name: recordingFilename,
            type: 'EDF',
            path: recordingPath,
        });
        if (data) return;
        let patientNumber = recordingFilename.split('-')[0];
        patientNumber = '' + patientNumber;
        let patient = Patients.findOne({
            id: patientNumber,
        });
        let patientId;
        if (patient) {
            patientId = patient._id;
            console.log('Patient #' + patientNumber + ' (' + patientId + ') already exists. Re-using patient ...');                
        }
        else {
            patientId = Patients.insert({
                id: patientNumber,
            });
            console.log('Created Patient #' + patientNumber + ' (' + patientId + ')');
        }
        console.log(recordingFilename, patientNumber);
        const metadataEDF = Meteor.call('get.edf.metadata', recordingPath);
        const metadata = {
            wfdbdesc: metadataEDF,
        };
        const dataId = Data.insert({
            name: recordingFilename,
            type: 'EDF',
            patient: patientId,
            path: recordingPath,
            metadata: metadata,
        });
        data = Data.findOne(dataId);
        console.log('Created Data "' + recordingPath + '" (' + dataId + ')');
        console.log(metadata.wfdbdesc.Groups[0]);
    });

    if(recordingPaths.length > 1){

        const recordingPathParts = recordingPaths[0].split('/');
        const recordingFilename = recordingPathParts[recordingPathParts.length - 1];

        const recordingPathParts2 = recordingPaths[1].split('/');
        const recordingFilename2 = recordingPathParts2[recordingPathParts2.length - 1];

        let data = Data.findOne({
            name: recordingFilename,
            type: 'EDF',
            path: recordingPaths[0],
        });
        let data2 =Data.findOne({
            name: recordingFilename2,
            type: 'EDF',
            path: recordingPaths[1],
        });
        if (!data || !data2) return;

        assignment = Assignments.findOne({
            users: testUser._id,
            task: taskId,
            data: data._id,
            data2: data2._id
        });
        if (!assignment) {
            const assignmentId = Assignments.insert({
                users: [ testUser._id ],
                task: taskId,
                data: data._id,
                data2: data2._id,
                status: 'Pending',
                channelsDelayed: '',
            });
            console.log('Created Assignment for Task "' + task.name + '", User "' + testUser.email + '" and Data "' + data.name + 'and' + data2.name+'" (' + assignmentId + ')');
        }


    }
    else
    {
        recordingPaths.forEach((recordingPath) => {
        const recordingPathParts = recordingPath.split('/');
        const recordingFilename = recordingPathParts[recordingPathParts.length - 1];
        let data = Data.findOne({
            name: recordingFilename,
            type: 'EDF',
            path: recordingPath,
        });
        if (!data) return;

        assignment = Assignments.findOne({
            users: testUser._id,
            task: taskId,
            data: data._id,
        });
        if (!assignment) {
            const assignmentId = Assignments.insert({
                users: [ testUser._id ],
                task: taskId,
                data: data._id,
                status: 'Pending',
                channelsDelayed: '',
            });
            console.log('Created Assignment for Task "' + task.name + '", User "' + testUser.email + '" and Data "' + data.name + '" (' + assignmentId + ')');
        }
    })}
});
