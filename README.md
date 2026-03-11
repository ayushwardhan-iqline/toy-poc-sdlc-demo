# Toy POC SDLC Demo
A toy setup to test the "gates" in an SDLC pipeline (Product -> Dev -> QA)

What it is:
- Simple full-stack app that lets a patient be registered and a visit be created
- Has CI pipeline stages defined
- Has a simple directory of markdown files for "user-story" docs

## SDLC Infrastructure
This repository uses a structured approach for managing the development lifecycle:
- `user-stories/`: Contains markdown files representing user requirements, following the Mike Cohn format with Gherkin acceptance criteria (see `user-story` skill).
- `engineering-tasks/`: Contains markdown files for technical tasks linked to user stories.
- `progress-tracker.json`: A top-level tracker to monitor the status and links between user stories and engineering tasks.