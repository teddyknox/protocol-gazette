# Protocol Gazette

If you're a protocol specialist at a proof-of-stake validator, you probably know how tiresome it can be to keep up with the news, especially the governance news. Each network has its own Discord servers, Discourse forums, Twitter accounts, and more to follow, and with 20+ networks this quickly becomes too much to manually manage.

To simplify our job at Stakefish Governance, we built a simple service to watch these various communication channels and relay their messages to our source of truth: Slack.

Data sources for the system can either be either push or pull, and the Slack channel outputs are highly configurable to support a variety of use-cases. For example, you might prefer for the Slackbot to put all network alerts in a single channel, or separate network alerts into network-specific channel.