# CS2 Docker – Practice Exam (v0.1)

A free, browser-based practice exam for **Computersystemen 2 – Docker** (KdG). No login or account needed.

**Open the practice exam:** https://sugarnomilk.github.io/KdG-ComputerSystems-Docker/

> **Language:** the app and all questions are in **Dutch**, the same language as the real exam.

## What's included

- **136 questions** in the draw:

  | Topic | Questions |
  |---|---|
  | Containers on Linux (chroot, namespaces, cgroups, VM vs container) | 22 |
  | Docker CLI (images vs containers, `ps`, `logs`, `exec`, `--rm`, tags) | 22 |
  | Ports and volumes (`-p`, bind mounts vs named volumes) | 13 |
  | Docker Compose (`up -d`, `--build`, `down`, volumes, `.env`) | 19 |
  | Dockerfile (RUN vs CMD/ENTRYPOINT, WORKDIR, ENV, EXPOSE) | 15 |
  | Layers, cache, multi-stage builds, security, secrets | 29 |
  | Publishing (naming, tagging, Docker Hub, local registry) | 16 |

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

## Privacy

Your progress (only your current or last session, so you can resume) is stored in your own browser; nothing is sent anywhere. Use **"Kopieer resultaat"** at the end to keep your result or to go over your mistakes later (with AI or a classmate).

## Found a mistake?

Open an [issue](https://github.com/sugarnomilk/KdG-ComputerSystems-Docker/issues) with the question ID (e.g. `R8-35`) and what is wrong, ideally with the slide that backs it up. Reported mistakes are fixed and the affected options removed or rewritten.

## Recent changes (9 Nov)

- Cleanup: 15 near-duplicate or out-of-scope questions removed.
- Stricter fill-in grading where answers were too lenient (`.env` needs the dot; commands need `docker`); any unique container-ID prefix is now accepted.
- One question reworded to remove ambiguity.

## Upcoming

- More questions on topics that are still underrepresented (publishing, Dockerfile instructions, ports, Compose details, container security).
- Smarter sessions: remember per question whether you got it right, and draw new and previously missed questions first (stored locally, with a reset button).
- A "report a mistake" button on every question.
- Code cleanup: proper, semantic HTML and CSS, and the questions in a separate file so others can contribute.
- A generalized version that can be reused for other exams.

---

Part of the questions come from the course's sample exam. For study purposes only.
