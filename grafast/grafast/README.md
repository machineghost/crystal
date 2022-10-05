# Grafast

[![GitHub Sponsors](https://img.shields.io/github/sponsors/benjie?color=ff69b4&label=github%20sponsors)](https://github.com/sponsors/benjie)
[![Patreon sponsor button](https://img.shields.io/badge/sponsor-via%20Patreon-orange.svg)](https://patreon.com/benjie)
[![Discord chat room](https://img.shields.io/discord/489127045289476126.svg)](http://discord.gg/graphile)
[![Follow](https://img.shields.io/badge/twitter-@GrafastHQ-blueviolet.svg)](https://twitter.com/GrafastHQ)

_**A cutting-edge planning and execution engine for GraphQL**_

Grafast understands GraphQL and (with your help) it understands your business
logic; this allows it to orchestrate a GraphQL request's data requirements in an
extremely efficient manner, leading to excellent performance, reduced server
load, and happier customers.

<!-- SPONSORS_BEGIN -->

## Crowd-funded open-source software

To help us develop this software sustainably under the MIT license, we ask all
individuals and businesses that use it to help support its ongoing maintenance
and development via sponsorship.

### [Click here to find out more about sponsors and sponsorship.](https://www.graphile.org/sponsor/)

And please give some love to our featured sponsors 🤩:

<table><tr>
<td align="center"><a href="https://surge.io/"><img src="https://graphile.org/images/sponsors/surge.png" width="90" height="90" alt="Surge" /><br />Surge</a> *</td>
<td align="center"><a href="https://storyscript.com/?utm_source=postgraphile"><img src="https://graphile.org/images/sponsors/storyscript.png" width="90" height="90" alt="Story.ai" /><br />Story.ai</a> *</td>
<td align="center"><a href="http://chads.website"><img src="https://graphile.org/images/sponsors/chadf.png" width="90" height="90" alt="Chad Furman" /><br />Chad Furman</a> *</td>
<td align="center"><a href="https://www.fanatics.com/"><img src="https://graphile.org/images/sponsors/fanatics.png" width="90" height="90" alt="Fanatics" /><br />Fanatics</a> *</td>
</tr><tr>
<td align="center"><a href="https://qwick.com/"><img src="https://graphile.org/images/sponsors/qwick.png" width="90" height="90" alt="Qwick" /><br />Qwick</a> *</td>
<td align="center"><a href="https://www.the-guild.dev/"><img src="https://graphile.org/images/sponsors/theguild.png" width="90" height="90" alt="The Guild" /><br />The Guild</a> *</td>
<td align="center"><a href="https://dovetailapp.com/"><img src="https://graphile.org/images/sponsors/dovetail.png" width="90" height="90" alt="Dovetail" /><br />Dovetail</a> *</td>
<td align="center"><a href="https://www.enzuzo.com/"><img src="https://graphile.org/images/sponsors/enzuzo.png" width="90" height="90" alt="Enzuzo" /><br />Enzuzo</a> *</td>
</tr><tr>
<td align="center"><a href="https://stellate.co/"><img src="https://graphile.org/images/sponsors/Stellate.png" width="90" height="90" alt="Stellate" /><br />Stellate</a> *</td>
</tr></table>

<em>\* Sponsors the entire Graphile suite</em>

<!-- SPONSORS_END -->

## About

Grafast is an alternative planning and execution engine for JavaScript; you can
use it as a drop-in replacement for the "execute" method of GraphQL.js for the
very best performance results - especially when combined with Grafast Server.

When Grafast sees a GraphQL request for the first time it will "plan" the
request: figuring out the data requirements, the steps that need to be taken,
and how to write the results to the response. This "first draft" plan will be
optimised and rewritten to give the best achievable performance (for example
removing redundant or duplicate processing steps, rewriting and merging
processing steps, etc). Finally, the plan will be executed, and the data
returned to the client. Future requests that are compatible with this plan can
be executed immediately without a need to re-plan.

## Requirements

Grafast can be used with any GraphQL.js schema that matches the following
requirements:

- GraphQL.js v16+
- you must not override the default GraphQL field resolver (TODO: support this)
- for every request:
  - `context` must be an object (anything suitable to be used as the key to a
    `WeakMap`); if you do not need a context then `{}` is perfectly acceptable
  - `rootValue` must be an object or `null`/`undefined`

## Advice

To reap the most benefit from using Grafast, you want as little to change
between executions as possible. In particular, this means you should:

- Cache (e.g. with a LRU cache) the parsed GraphQL document, so the same AST can
  be reused over and over for the same document
- Cache (e.g. with a LRU cache) the GraphQL `context` object, so the same
  context can be reused over and over for the same user
- Don't use `rootValue` (Do you really need it? Use `context` instead.)
- Where possible, memoize the variables object (e.g. using a cache over
  `canonicalJSONStringify(variables)`) so the same variables results in the same
  object in memory

## Usage

Use the `grafastExecute` and `grafastGraphql` methods from `grafast` as your
would use the `execute` and `graphql` methods from the `graphql` module.

TODO: document the options object.