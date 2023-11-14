const core = require('@actions/core');
const github = require('@actions/github');

try {
    const token = core.getInput('token');
    if (!token) {
        core.setFailed('Missing GitHub access token.');
        return;
    }

    const { head: { ref }, title, body } = github.context.payload.pull_request;
    const prBranchName = ref || '';
    const prTitle = title || '';
    const prBody = body || '';
    const workItemNumber = prBranchName?.match(/^(\d+)/)?.[0];

    if (isNaN(Number(workItemNumber))) {
        core.setFailed('Branch name does not include work item number.');
        return;
    }

    if (prTitle.includes(workItemNumber) && prBody.includes(workItemNumber)) {
        core.info('PR title and body already contain the work item number.');
        return;
    }

    const newPrTitle = !prTitle.includes(workItemNumber) ?
        `${workItemNumber} - ${prTitle}` :
        prTitle;

    const newPrBody = !prBody.includes(workItemNumber) ?
        `${prBody}\n AB#${workItemNumber}` :
        prBody;

    if (newPrTitle !== prTitle) {
        core.info(`Updating PR title to: ${newPrTitle}`);
        core.setOutput('pr_title', newPrTitle);
    }

    if (newPrBody !== prBody) {
        core.info(`Updating PR body to: ${newPrBody}`);
        core.setOutput('pr_body', newPrBody);
    }

    const octokit = github.getOctokit(token);
    octokit.rest.pulls.update({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request.number,
        body: newPrBody,
        title: newPrTitle
    });
} catch (error) {
    core.error(error);
    core.setFailed(error.message);
}