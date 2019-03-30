#!/usr/bin/env node

/*
 * Command line script to analyze a URL for debugging purposes.
 *
 * See cli.ts for details.
 */

require('dotenv').config()

import Cli from './cli'

const cli = new Cli()
cli.run()
