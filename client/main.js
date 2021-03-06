import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Settings } from '../settings.js';
import { Branches } from '../branches.js';

import './main.html';

Template.main.onCreated(function helloOnCreated() {
  this.branches = new ReactiveVar([])
  
  this.branches.set(Branches.find())
});

Template.reloadButtons.events({
  'click #reload'(event) {
    Meteor.call('reloadBranches', (err, res) => {
      if(err) {
        alert(err);
      } else {
        console.log(res);
      }
    });
  }
});

Template.main.helpers({
  settings() {      
      return {
          collection: Branches.find().fetch(),
          rowsPerPage: 500,
          showFilter: true,
          rowClass: function(item) {
            var daysAgo = item.daysAgo;
            if(daysAgo > 50) {
              return 'danger'
            }

            if(daysAgo > 20) {
              return 'warning'
            }

            return 'success'
          },
          fields: [
            { key: 'repo', label: 'Repository' },
            { key: 'name', label: 'Branch', tmpl: Template.tdBranch},
            { key: 'merged', label: 'Merged?', tmpl: Template.tdMerged},
            { key: 'daysAgo', label: 'Days'},
            { key: 'shortHash', label: 'Hash', tmpl: Template.tdHash},
            { key: 'author', label: 'Author'},
            { key: 'message', label: 'Message'},
        ]
      }
  },
});