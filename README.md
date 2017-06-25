# GitHub Automaton

<img src="https://github.com/niranjan94/github-automaton/blob/master/public/img/blue-robot-hi.png?raw=true" width="300">

> A GitHub Bot + _a bot framework-like thingy_ inspired by [babel-bot](https://github.com/babel/babel-bot).

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)


#### What can this do ?

- Add a comment and a label asking for more information if an newly created issue has less information.
- Add a comment asking for more info if an issue is labelled with `needs-info`.
- Add a comment if a PR build fails with a link to the logs. (Only travis supported).
- Delete pointless comments that have +1, -1 or only emojis.
- Allows moving issues to other repos via comments (`@<bot-name> move to username/repo`).
- Labels new PRs with `needs-review` tag.
- Label PRs with `ready-to-ship` once they get merged.
- Add a comment requesting the PR creator to rebase/resolve conflicts if any conflicts are found on the PR.

> All comments that request an action are deleted once the requested action is completed

#### What can this do in a few weeks ?
- Auto request PR reviews from contributors based on blame info from the files changed. (Using [mention-bot](https://github.com/facebook/mention-bot)'s programmatic API)
- Search for preview deployment links in PRs and request for them if not found.

#### Open Source License

Unless explicitly stated otherwise all files in this repository are licensed under the [Apache Software License 2.0](http://www.apache.org/licenses/LICENSE-2.0.html). All projects **must** properly attribute [The Original Source](https://github.com/niranjan94/github-automaton). 

```
Copyright 2017 Niranjan Rajendran

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

An unmodified copy of the above license text must be included in all forks.