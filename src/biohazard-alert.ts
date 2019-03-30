#!/usr/bin/env node

require('dotenv').config()

import Cli from './cli'

const cli = new Cli()
cli.run()
