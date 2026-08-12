---
name: grill-requirements
description: Interrogate and clarify a software request before implementation when requirements, behavior, acceptance criteria, edge cases, or scope are ambiguous.
---

# Grill Requirements

## Purpose

Turn an underspecified request into a precise engineering problem before code is written.

## Procedure

1. Restate the desired outcome.
2. Inspect existing terminology and behavior.
3. Identify unknowns that could change implementation.
4. Ask the smallest set of high-value questions.
5. Separate confirmed facts from assumptions.
6. Define observable acceptance criteria.
7. Define edge and failure cases.
8. Record out-of-scope behavior.

## Do not

- ask questions the repository can answer
- invent business rules
- turn preferences into requirements
- expand scope

## Question Format

When a decision can reasonably be represented by a finite set of
meaningful options, present it as a multiple-choice question.

Include an "Other / Not sure" option when appropriate.

Use free-text questions when:
- the answer is inherently open-ended
- the business owner needs to describe a custom rule
- predefined options could bias the answer

Ask only one question at a time.

## Output

Update a feature specification containing objective, confirmed behavior, decisions, assumptions, acceptance criteria, edge cases, out-of-scope behavior and open questions.
