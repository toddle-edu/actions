const { Octokit } = require("@octokit/rest");
const core = require("@actions/core");

(async () => {
  try {
    const actor = core.getInput("actor");
    const team_names = core.getInput("team_name").replace(/ /g, "").split(",");
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

    let isFailed = true;
    for (const team_slug of team_names) {
      //! Throw Error if input team slug is not existing in organization
      if (!team_list.includes(team_slug)) {
        core.error(
          `Team "${team_slug}" is Invalid! Not Exist in "${org}" organization`
        );
        continue;
      }
      console.log(
        `=> Team "${team_slug}" exist in "${org}" organization! Trying to fetch team members...`
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
      if (team_members_list.includes(actor)) {
        isFailed = false;
        core.notice(
          `User "${actor}" is authorized by "${team_slug}" Team to run pipeline ✅!`
        );
        break;
      }
    }

    if (isFailed) {
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
