const { Octokit } = require("@octokit/rest");
const core = require("@actions/core");

(async () => {
  try {
    const actor = core.getInput("actor");
    const team_slug = core.getInput("team_name");
    const token = core.getInput("token");
    const org = core.getInput("organization_name");

    console.log(
      "=> Completed Environment Variable Set! Fetching teams in organization..."
    );

    const octokit = new Octokit({
      auth: token
    });

    //~> Fetch teams in organization
    let team_list = await octokit.request(
      "GET /orgs/{org}/teams{?per_page,page}",
      {
        org
      }
    );
    team_list = team_list.data.map(team => team.slug);
    //! Throw Error if input team slug is not existing in organization
    if (!team_list.includes(team_slug)) {
      throw new Error(
        `Team "${team_slug}" is Invalid! Not Exist in "${org}" organization`
      );
    }
    console.log(
      `=> Team exit in "${org}" organization! Trying to fetch team members...`
    );

    //~> Fetch team members
    let team_members_list = await octokit.request(
      "GET /orgs/{org}/teams/{team_slug}/members{?role,per_page,page}",
      {
        org,
        team_slug,
        per_page: 100
      }
    );
    team_members_list = team_members_list.data.map(user => {
      if (user.type == "User") {
        return user.login;
      } else {
        return user.id;
      }
    });
    //! Throw error if member is not part of target team
    if (!team_members_list.includes(actor)) {
      throw new Error(
        `User "${actor}" is not authorized to run github pipeline`
      );
    }
    core.setOutput("is_allowed", true);
    console.log(`"${actor}" is Authorized to run pipeline ✅!`);
  } catch (e) {
    // console.log(e);
    core.setFailed(e.message || JSON.stringify(e, null, 2));
  }
})();
