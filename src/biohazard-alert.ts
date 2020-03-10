#!/usr/bin/env node

/*
 * Command line script to analyze a URL for debugging purposes.
 *
 * See cli.ts for details.
 */

import Cli from './cli';

require('dotenv').config();

const cli = new Cli();
cli.run();
