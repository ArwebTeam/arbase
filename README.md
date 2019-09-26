# aragon

Aragon is a tool to create object-based APIs on top of arweave in mere minutes

# What does it do?

It allows you to generate APIs from a simple JSON format

# Example

```js
{
  "post": { // let's first create a post
    "attributes": { // it's got some attributes
      "title": { // like a titlte
        "type": "string", // ...which is a string
        "maxSize": 1000, // ...that's limited to 1k characters
        "notNull": true, // ...and can't be empty
        "modify": [ // it can only be modified by the creator and the moderators
          "$.creator", // we use $ to reference the current object. in this case the creator of it
          "$~moderators" // and the moderators of this post
        ]
      },
      "content": { // every post also has content, which has basically the same rules
        "type": "string",
        "maxSize": 10000, // ...except it's 10k chars long
        "notNull": true,
        "modify": [
          "$.creator",
          "$~moderators"
        ]
      },
      "replies": { // then we have the replies
        "type": "post[]", // that's basically a list of posts (posts can have their own replies, like in reddit or discourse - really, just different rendering)
        // this list doesn't have a maxSize, since they can be grown infinetly without too much impact (TODO: really good idea?), but technically it can be set
        // notNull is also not set, since posts usually are created without replies
        "append": [ // this says who can reply
          "$.creator", // we can reply to our own stuff of course
          "*", // anyone else can as well (wildcard = "anyone")
          "!#~blacklisted", // but blacklisted users can't (this basically translated to "NOT (!) previous element (#) access control (~) blacklisted")
        ],
        "delete": [ // this says who can delete replies
          "$$.creator", // users can remove their own replies ($$ references the object in the list)
          "#"
        ]
      },
      "acl": { // we'll get to that later
        "moderators": { // for now just know: it allows moderators of the topic to moderate this post
          "fixed": [
            "#~moderators"
          ]
        }
      }
    }
  },
  "topic": { // now let's make the topics
    "attributes": {
      "title": { // every topics has a title
        "type": "string",
        "maxSize": 1000,
        "notNull": true,
        "modify": [ // it can be modified by the moderators
          "$~moderators"
        ]
      },
      "description": { // and a short description
        "type": "string",
        "maxSize": 1000,
        "notNull": true,
        "modify": [ // it can be modified by the moderators as well
          "$~moderators"
        ]
      },
      "posts": { // also it can contain posts, similar to replies
        "type": "post[]",
        "append": [
          "*", // again everyone can reply to it
          "#~blacklisted" // except blacklisted users
        ]
      },
      "topics": { // and it can contain sub-topics
        "type": "topic[]",
        "append": [ // ..which only moderators can add
          "$~moderators"
        ],
        "delete": [
          "$~moderators" // ...and only moderator can remove
        ]
      }
    },
    "acl": { // access control lists. this is where the permission magic happens
      "moderators": { // we have a moderators list
        "initial": [ // initially it contains the creator
          "$creator"
        ],
        "fixed": [ // permanently it contains the sub-topic moderators
          "#~moderators"
          // TODO: possibly add "$~blacklisted" ?
        ],
        "append": [ // anyone can append who's already a moderator
          "$~moderators"
        ],
        "delete": [ // same goes for deleting (you can de-mod yourself for e.x.)
          "$~moderators"
        ]
      },
      "blacklisted": { // the blacklisted users list
        "fixed": [
          "#~blacklisted" // include users that are blacklisted in the previous element
        ]
      }
    }
  },
  "board": { // this is our board
    "attributes": {
      "name": { // every board has a name
        "type": "string",
        "maxSize": 1000,
        "notNull": true,
        "modify": [ // it can be modified by the moderators
          "$~moderators"
        ]
      },
      "description": { // and a short description
        "type": "string",
        "maxSize": 1000,
        "notNull": true,
        "modify": [ // it can be modified by the moderators as well
          "$~moderators"
        ]
      },
      "topics": { // and it can contain topics
        "type": "topic[]",
        "append": [ // ..which only moderators can add
          "$~moderators"
        ],
        "delete": [
          "$~moderators" // ...and only moderator can remove
        ]
      }
      // basically like a topic, except it can't contain posts
    }
    "acl": { // here the acl are a little bit different
      "moderators": {
        "fixed": [ // the creator is an irremovable moderator
          "$creator"
        ],
        "append": [
          "$~moderators"
        ]
      },
      "blacklisted": {
        "fixed": [ // also the creator can never be blacklisted
          "!$creator"
        ],
        "append": [
          "$~moderators"
        ]
      }
      // and the previous references are missing, since this is the main element
    }
  },
  "$main": "board" // this tells the crud api that "board" is the base element. as such it's not allowed to contain any "#" references
}
// also noticed how we're not using any time elements? the time is always available via $.createdOn or $.updatedOn, since we're using a blockchain beneath
// sidenote: ## is "previous of previous" in the tree
```

# Good to know

- The `$.creator` permission might be dangerous
  - It is valid _even when a blacklist entry applies in specific conditions_. Therefore it's better to not add it when using anyone (`*`), or make it the initial content of an acl, so it can be revoked later when needed.

# Todo

## Now
- Base object
- OPLog
- Lists
- ACLs

## Future

- Rate-limiting
- Native "file" field that links to an arweave file-block
- @imports: Basically `"@imports": { "namespace": "npm:some-cool-scheme/db.json", "namespace-2": "fs:./other-thing.json" }`, so that we can do for ex `namespace:thing[]` or `namespace:thing`

# Backwards compatibility

- The removal of an attribute causes it to simply be ignored on verification, so attributes can be safely deleted
  - Note that all elements that do not contain at least one valid attribute are ignored. But this shouldn't be an issue since they are obsoleted in that case, except if the creation is followed by edits that do introduce valid elements)
- The change of an ACL initial/fixed set could invalidate entries if not done carefully
- Same goes for the removal of a complete ACL
- The addition of an ACL usually doesn't change anything
