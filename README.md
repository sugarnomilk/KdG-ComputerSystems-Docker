# CS2 Docker – Practice Exam (v0.2)

A free, browser-based practice exam for **Computersystemen 2 – Docker** (KdG). No login or account needed.

**Open the practice exam:** https://sugarnomilk.github.io/KdG-ComputerSystems-Docker/

> **Language:** the app and all questions are in **Dutch**, the same language as the real exam.

## What's included

- **149 questions** in the draw:

  | Topic | Questions |
  |---|---|
  | Containers on Linux (chroot, namespaces, cgroups, VM vs container, container security) | 23 |
  | Docker CLI (images vs containers, `ps`, `logs`, `exec`, `rm`, `--rm`, tags) | 21 |
  | Ports and volumes (`-p`, `-P`, bind mounts vs named volumes) | 18 |
  | Docker Compose (`up -d`, `--build`, `down`, volumes, `.env`, service names, `exec`) | 24 |
  | Dockerfile (RUN vs CMD/ENTRYPOINT, WORKDIR, ENV, EXPOSE, ADD vs COPY, LABEL) | 16 |
  | Layers, cache, multi-stage builds, security, secrets | 26 |
  | Publishing (naming, tagging, Docker Hub, local registry, `start` vs `run`) | 21 |

- Questions from the course's sample exam plus extra practice questions, a bit harder than the sample exam.
- Choose 10 to 40 questions per session; every topic appears at least once. Each new session is a fresh random draw.
- Scope: Docker Engine on Linux, as taught in the course. Topics the teacher marked out of scope (e.g. Google Cloud / serverless containers, Docker Desktop, `scratch` images, ENTRYPOINT and CMD combined) are left out.

## Scoring (same rules as the real exam)

| Question type | Points | Grading |
|---|---|---|
| Multiple choice (one answer) | 1 | correct = 1, wrong = 0 |
| Fill-in | 2 | all or nothing |
| Multiple answers | 2 | each correct option you select is worth 2 ÷ (number of correct options); **each wrong option you select costs the same amount**; never below 0 |

So don't guess on multiple-answer questions. Fill-in answers ignore capitals, extra spaces, quotes and a trailing period. A "full command" must start with `docker`; a container ID may be shortened to any unique prefix, as in the sample exam.

## Project structure

```
index.html            semantic page skeleton + <template>s for each screen
css/                  tokens (colours), base (elements), layout, components
js/                   ES modules: main, config, data, state, quiz (rules), util, dom
js/views/             header, start, question, end (one module per screen)
data/questions.json   all questions (HTML allowed inside text fields)
data/topics.json      the seven course topics
tests/check.mjs       data and rules checks
```

No build step and no dependencies: plain HTML, CSS and ES modules. The questions are loaded with `fetch`, so open the page through a web server (GitHub Pages, or locally `python3 -m http.server` and then `http://localhost:8000`); double-clicking `index.html` does not work.

## Contributing

Run the checks before opening a pull request:

```
node tests/check.mjs
```

Each question in `data/questions.json` has these fields:

| Field | Meaning |
|---|---|
| `id` | unique, e.g. `R10-3` |
| `topic` | `t1`–`t7` (see `data/topics.json`); without a topic the question is never drawn |
| `type` | `mc` (one answer), `multi` (several answers), `fill`, `open` |
| `pts` | points: 1 for `mc`, 2 otherwise |
| `source` | shown under the question, e.g. `Oefenronde 10` |
| `q`, `opts`, `ex` | question, options and explanation lines (HTML allowed) |
| `ok` | indexes of the correct options (`mc`, `multi`) |
| `answer`, `accept` or `regex` | `fill`: the answer shown, and the accepted answers or a regular expression (tested on lower-cased input with single spaces) |
| `model` | `open`: model answer lines |

Keep one concept per question, and stay within the course material. The localStorage key (`STORAGE_KEY` in `js/config.js`) must not change, or learners lose their saved progress.

## Privacy

Your progress (only your current or last session, so you can resume) is stored in your own browser; nothing is sent anywhere. Use **"Kopieer resultaat"** at the end to keep your result or to go over your mistakes later (with AI or a classmate).

## Found a mistake?

Open an [issue](https://github.com/sugarnomilk/KdG-ComputerSystems-Docker/issues) with the question ID (e.g. `R8-35`) and what is wrong, ideally with the slide that backs it up. Reported mistakes are fixed and the affected options removed or rewritten.

## Changelog

### v0.2 (9 Nov)
- 17 new questions on topics that were underrepresented: publishing (naming, push per tag, local registry, `start` vs `run`), Dockerfile (ADD vs COPY, LABEL, multiple COPY sources, relative WORKDIR), ports (`-P`, `-p`, privileged ports), Compose (service names as hostnames, container names, `compose exec`) and container security.
- New questions test one concept each, like the real exam; options that relied on material outside the slides were left out.

### v0.1 (9 Nov)
- Cleanup: 15 near-duplicate or out-of-scope questions removed.
- Stricter fill-in grading where answers were too lenient (`.env` needs the dot; commands need `docker`); any unique container-ID prefix is now accepted.
- One question reworded to remove ambiguity.

## Unreleased

- Code cleanup: semantic HTML with templates, CSS and JavaScript in separate folders, and the questions in `data/questions.json`. Behaviour and look are unchanged.
- Question bank cleanup: 19 combination or near-duplicate questions archived, 15 new questions from the 10 Nov practice exam.
- The page now needs a web server (see Project structure).

## Upcoming

- Smarter sessions: remember per question whether you got it right, and draw new and previously missed questions first (stored locally, with a reset button).
- A "report a mistake" button on every question.
- A generalized version that can be reused for other exams.

---

Part of the questions come from the course's sample exam. For study purposes only.
