const token = process.env.TOKEN;
const filename = process.env.FILENAME;
const org = "mroth";
const project = "mroth";

async function fetchIssueEvents(issue, token) {
  const res = await fetch(
    `https://sentry.io/api/0/issues/${issue.id}/events/latest/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const events = await res.json();

  if (!events || events.entries.length === 0) {
    return null;
  }

  const entries = events.entries;

  // const entries = data.entries;
  const exception = entries.find((entry) => entry.type === "exception");
  const stacktrace = exception?.data?.values[0].stacktrace;
  const { frames } = stacktrace;
  const relevantFrame = frames[frames.length - 1];
  const { lineNo } = relevantFrame;

  const lastSeen = issue.lastSeen;
  const count = parseInt(issue.count);
  const payload = {
    line: lineNo,
    lastSeen,
    count,
    id: issue.id,
  };

  console.log(payload);

  return payload;
}

async function main() {
  const sentryBaseUrl = `https://sentry.io/api/0/projects/${org}/${project}/`;
  const issuesUrl = `${sentryBaseUrl}issues`;
  const issuesParams = new URLSearchParams({
    query: `stack.filename:./${filename} is:unresolved`,
  });

  const res = await fetch(issuesUrl + issuesParams.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const issues = await res.json();

  if (!issues || issues.length === 0) {
    return null;
  }

  return await Promise.all(
    issues.map((issue) => fetchIssueEvents(issue, token))
  );
}

main();
