import { Assignments, Data, Tasks, Annotations, Preferences } from '/collections';

Router.configure({
    loadingTemplate: 'spinner',
});

Router.onBeforeAction(function () {
    if (!Meteor.userId()) {
        this.render('Home');
    } else {
        this.next();
    }
}, {
    except: [
        'resetPassword',
        'loginWithTestAccount',
    ]
});

Router.route('/reset-password/:token', {
    name: 'resetPassword',
    action: function() {
        Accounts.resetPassword(this.params.token, prompt('Enter a new password:'), () => {
            this.redirect('home');
        });
    }
});

Router.route('/', function () {
    Meteor.subscribe('assignments', this.params._id);
    this.render('Home');
}, {
    name: 'home',
});

Router.route('/assignment/:_id', {
    name: 'assignment',
    waitOn: function () {
        const assignmentId = this.params._id;
        return [
            Meteor.subscribe('roles'),
            Meteor.subscribe('assignment', assignmentId),
        ];
    },
    action: function() {
        let assignmentId = this.params._id;
        let assignment = Assignments.findOne(assignmentId, { reactive: false });
        if (!assignment) {
            this.redirect('home');
            return;
        }
        assignment = assignment.activeLeafAssignment({ reactive: false });
        assignmentId = assignment._id;
        if (assignment.blockedForReason()) {
            this.redirect('home');
            return;
        }
        var data = Data.findOne(assignment.data);
        const data2 = Data.findOne(assignment.data2);
        const task = Tasks.findOne(assignment.task);
        const annotations = Annotations.find({ assignment: assignmentId }).fetch();
        var preferences = Preferences.findOne({ assignment: assignmentId, user: Meteor.userId() }, { reactive: false });
        if (!preferences) {
            const preferencesId = Preferences.insert({
                assignment: assignment._id,
                user: Meteor.userId(),
                data: assignment.data,
                //data2: assignment.data2,
                annotatorConfig: {},
            });
            preferences = Preferences.findOne({ assignment: assignmentId, user: Meteor.userId() }, { reactive: false })
        }
        this.render('Assignment', {
            data: { assignment, data, data2, task, annotations, preferences },
            //data2 : { assignment, data2, task, annotations, preferences },
        });    
        /*   
        data = Data.findOne(assignment.data2);
        preferences = Preferences.findOne({ assignment: assignmentId, user: Meteor.userId() }, { reactive: false });
        if (!preferences) {
            const preferencesId = Preferences.insert({
                assignment: assignment._id,
                user: Meteor.userId(),
                data: assignment.data2,
                //data2: assignment.data2,
                annotatorConfig: {},
            });
            preferences = Preferences.findOne({ assignment: assignmentId, user: Meteor.userId() }, { reactive: false })
        }

        this.render('Assignment', {
            data: { assignment, data, task, annotations, preferences },
            //data2 : { assignment, data2, task, annotations, preferences },
            
        });    
        */
    }
});

Router.route('/status', {
    name: 'status',
    waitOn: function () {
        return [
            Meteor.subscribe('roles'),
            Meteor.subscribe('all'),
            Meteor.subscribe('allAnnotationsGlobalPerDataObject'),
        ];
    },
    action: function () {
        if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
            this.redirect('home');
            return;
        }
        this.render('Status');
    }
});

Router.route('/assign', {
    name: 'assign',
    waitOn: function () {
        return [
            Meteor.subscribe('roles'),
            Meteor.subscribe('all'),
        ];
    },
    action: function () {
        if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
            this.redirect('home');
            return;
        }
        this.render('Assign');
    }
});

Router.route('/data', {
    name: 'data',
    waitOn: function () {
        return [
            Meteor.subscribe('roles'),
            Meteor.subscribe('all'),
        ];
    },
    action: function () {
        if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
            this.redirect('home');
            return;
        }
        this.render('Data');
    }
});

Router.route('/arbitrations', {
    name: 'arbitrations',
    waitOn: function () {
        return [
            Meteor.subscribe('roles'),
            Meteor.subscribe('all'),
        ];
    },
    action: function () {
        if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
            this.redirect('home');
            return;
        }
        this.render('Arbitrations');
    }
});

Router.route('/login-with-test-account', {
    name: 'loginWithTestAccount',
    action: function () {
        Meteor.loginWithPassword('test@example.com', 'test', () => {
            this.redirect('home');
        });
    }
});
