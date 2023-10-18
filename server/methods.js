import { Assignments, Annotations } from '/collections';

Meteor.methods({
    updateAssignmentWithoutHook(assignmendId, modifier) {
        const assignment = Assignments.findOne(assignmendId);
        if (
            Roles.userIsInRole(this.userId, 'admin')
            || assignment.users.indexOf(this.userId) >= 0
        ) {
            Assignments.direct.update({ _id: assignmendId }, modifier);
        }
    },
    // function that deletes an assignment for the index.js in Assignments
    deleteAssignmentForReview(data){
        try{
            const assignment = Assignments.findOne(data);
            //console.log(assignment);
            const id = assignment._id;
            const reviewer = assignment.user;
            Assignments.remove(assignment._id);
            Annotations.remove({assignment: id});
            
        } catch (err){
            console.log(err);
        }
    },
    // function that updates an assignment given a query for index.js in Assignments
    updateAssignmentWithDataQuery(data, update){
        try{
           // console.log(data);
           // console.log(update);
            Assignments.update(data, update);
            //console.log("updated");
        } catch(err){
            console.log("error");
            console.log(err);
        }
    },
})