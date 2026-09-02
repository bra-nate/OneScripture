# Topical Scriptures editorial workflow

The database is the live runtime source for public topics. The version-controlled
file [`content/topics.json`](../content/topics.json) is the editorial source used
to review and publish changes safely.

## Update a topic

1. Edit the topic in `content/topics.json`.
2. Keep new or changing topics in `draft` or `review` status.
3. Run `npm run topics:validate`.
4. Ask the designated theological/editorial reviewer to approve the title,
   description, scripture choices, and order.
5. Change the approved topic's status to `published`.
6. Apply migration `0005_topical_scriptures.sql` if it is not installed yet.
7. Run `npm run topics:publish` with the production Supabase environment loaded.
8. Open `/topics` and the topic detail page to verify the published result.

The publish command validates every scripture range against the canonical World
English Bible catalogue before it writes. Each topic and its passages are then
replaced in one database transaction. If a reference or constraint is invalid,
that topic remains unchanged.

## Remove a public topic

Do not delete the JSON entry. Set its status to `archived`, run validation, and
publish. Archived topics disappear from public reads while retaining their
stable slug and editorial history in version control.

## Add or reorder passages

Edit the `references` array. Its array order is the listening order. References
must name explicit verses or ranges, such as `John 14:27` or
`Philippians 4:6-7`; whole chapters are intentionally rejected for topical
collections.

## Future admin screen

An authenticated editorial screen can later write through the same transactional
database function. Until role-based editorial permissions and an audit log are
implemented, the reviewed file and publish command are the safer workflow.
