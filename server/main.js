import { Meteor } from 'meteor/meteor';
import { Branches } from '../branches.js';
import { Settings } from '../settings.js';
'use strict';

var
    { spawnSync } = require( 'child_process' );

function logSpawnSync(name, params=[], repo) {
    let dir = Settings.repos[repo].dir
    let r = spawnSync(name, params, {cwd: dir})
    
    //console.log('ERROR: ' + r.stderr.toString());
    //console.log(r.stdout.toString());

    return r;
}

function getBranches(params, repo) {
    params.unshift('branch');

    let git = logSpawnSync('git', params , repo);

    return git.stdout.toString().split('\n').map(function(x) {
        let prefix = 'origin/';
        let cutFrom = x.indexOf(prefix) + prefix.length;

        return x.substring(cutFrom);
    });
}

function getLastCommit(branch, repo) {
    let gitLog = logSpawnSync('git', ['log', 'origin/' + branch, '-1'], repo);

    return parseCommit(gitLog.stdout.toString());
}

function parseCommit(logPart) {
    let mergeCommitRegex = /commit (.*)\nMerge: (.*)\nAuthor: (.*)\nDate:   (.*)\n\n    (.*)/;
    let normalCommitRegex = /commit (.*)\nAuthor: (.*)\nDate:   (.*)\n\n    (.*)/;

    var commitParts = logPart.match(mergeCommitRegex);

    if(commitParts != null) {
        return {
            hash: commitParts[2],
            author: commitParts[3],
            date: new Date(commitParts[4]),
            message: commitParts[5]
        };
    } else {
        var commitParts = logPart.match(normalCommitRegex);
        return {
            hash: commitParts[1],
            author: commitParts[2],
            date: new Date(commitParts[3]),
            message: commitParts[4]
        };
    }
}

Meteor.startup(() => {

});

function clearMongoCollection() {
    Branches.remove({})
}

function saveBranchesToMongo(branches) {
  branches.map(function(branch) {
      Branches.insert(branch);
  });
}

function loadBranchesFromGit(repo) {
    //load git branches
    var mergedBranches = getBranches(['-a', '-r', '--merged'], repo);

    var allBranches = getBranches(['-a', '-r'], repo)
    //remove empty lines
    .filter(function(val) {
        return val != '' && val != 'HEAD -> origin/master'
    })
    //check if branch was merged
    .map(function(val, index) {
        if(val != '') {
            var merged = false;
            if(mergedBranches.includes(val)) {
                merged = true;
            }

            return {
                'name': val,
                'merged': merged
            };
        }
    })
    //get last commit info
    .map(function(val, index) {
        let lastCommit = getLastCommit(val.name, repo);
        if(lastCommit != null) {
            val['author'] = lastCommit.author;

            let timeDiff = Math.abs(Date.now() - lastCommit.date.getTime());
            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
            val['daysAgo'] = diffDays; 

            val['message'] = lastCommit.message;
            val['hash'] = lastCommit.hash;
            val['shortHash'] = lastCommit.hash.substring(0,6);
            val['date'] = lastCommit.date;
            val['repo'] = repo;
            val['branchUrl'] = getBranchUrlForRepo(repo) + val.name
        }

        return val;
    });

    return allBranches;
}

function getRepos() {
    return Object.keys(Settings.repos)
}

function getBranchUrlForRepo(repo) {
    return Settings.repos[repo].branchUrl;
}

Meteor.methods({
  reloadBranches() {
    clearMongoCollection()
    getRepos().map(function(val) {
        saveBranchesToMongo(loadBranchesFromGit(val))
    });
  }
})