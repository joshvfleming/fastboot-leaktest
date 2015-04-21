# Leaktest

This is a test app for reproducing memory leaks in Ember FastBoot.

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](http://git-scm.com/)
* [Node.js](http://nodejs.org/) (with NPM)
* [Bower](http://bower.io/)
* [Ember CLI](http://www.ember-cli.com/)

## Installation

* `git clone git@github.com:joshvfleming/fastboot-leaktest.git` this repository
* change into the new directory
* `npm install`
* `bower install`
* Select "ember#canary" in the previous step if given an option.

## Running

First, build the client app in prod mode.

`ember build -prod`

Then reproduce the leak by running the following script:

`node scripts/test.js`

Now monitor memory usage with the profiler of your choice.
