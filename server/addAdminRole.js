import { Roles } from 'meteor/alanning:roles';

Roles.createRole("admin", {unlessExists: true});
Roles.createRole("reviewer", {unlessExists: true});