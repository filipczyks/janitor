import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Settings } from '../settings.js';

import './main.html';

Template.main.onCreated(function helloOnCreated() {
  this.branches = new ReactiveVar([]);

  Meteor.call('branches', (err, res) => {
    if(err) {
      alert(err);
    } else {
      console.log(res);
      res.map(function(val) {
        val['shortHash'] = val.hash.substring(0,6);
      });
      this.branches.set(res);
    }
  });
});

Template.main.helpers({
  settings() {
      return {
          collection: Template.instance().branches.get(),
          rowsPerPage: 500,
          showFilter: true,
          rowClass: function(item) {
            var daysAgo = item.daysAgo;
            if(daysAgo > 50) {
              return 'danger';
            }

            if(daysAgo > 20) {
              return 'warning';
            }

            return 'success';
          },
          fields: [
            { key: 'name', label: 'Branch', tmpl: Template.tdBranch},
            { key: 'merged', label: 'Merged?', tmpl: Template.tdMerged},
            { key: 'daysAgo', label: 'Days'},
            { key: 'shortHash', label: 'Hash', tmpl: Template.tdHash},
            { key: 'author', label: 'Author'},
            { key: 'message', label: 'Message'},
        ]
      };
    return ;
  },
});

Template.tdBranch.helpers({
  branchUrl() {
    return Settings.branchUrl;
  }
});