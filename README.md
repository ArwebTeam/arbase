# arcrud

Arcrud is a tool to create CRUD-based APIs on top of arweave in mere minutes

# What does it do?

It allows you to generate APIs from a simple JSON format

# Example

```json
{
  "post": {
    "type": "object",
  },
  "topic": {
    "type": "recursive-object",
    "attributes": {
      "title": {
        "type": "string"
      }
    },
    "modification": {
      "title": [
        ""
      ]
    },
    "acl": {
      "moderators": {
        "initial": [""]
      }
    }
  },
  "board": {
    "type": "list",
    "contents": "topic",
    "access": {
      "insert": {

      }
    }
  }
}
```

```js
{
  "post": { // let's first create a post
    "attributes": { // it's got some attributes
      "title": { // like a titlte
        "type": "string", // ...which is a string
        "maxSize": 1000, // ...that's limited to 1k characters
        "notNull": true, // ...and can't be empty
        "modify": [ // it can only be modified by the creator (TODO: or mods with edit permissions)
          "$.creator" // we use $ to reference the current object
        ]
      },
      "content": { // every post also has content, which has basically the same rules
        "type": "string",
        "maxSize": 10000, // ...except it's 10k chars long
        "notNull": true,
        "modify": [
          "$.creator"
        ]
      },
      "replies": { // then we have the replies
        "type": "post[]", // that's basically a list of posts (posts can have their own replies, like in reddit or discourse - really, just different rendering)
        // this list doesn't have a maxSize, since they can be grown infinetly without too much impact (TODO: really good idea?), but technically it can be set
        // notNull is also not set, since posts usually are created without replies
        "append": [ // this says who can reply
          "$creator", // we can reply to our own stuff of course
          "*", // anyone else can as well (wildcard = "anyone")
          "!#~blacklisted", // but blacklisted users can't (this basically translated to "NOT (!) previous element (#) access control (~) blacklisted")
        ],
        "delete": [ // this says who can delete replies
          "$$creator", // users can remove their own replies ($$ references the object in the list)
          "#"
        ]
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
      "acl": { // access control lists. this is where the permission magic happens
        "moderators": { // we have a moderators list
          "initial": [ // initially it contains the creator
            "$creator"
          ],
          "fixed": [ // permanently it contains the sub-topic moderators
            "#~moderators"
          ],
          "append": [ // anyone can append who's already a moderator
            "$~moderators"
          ],
          "delete": [ // same goes for deleting
            "$~moderators"
          ]
        }
      }
    },
    "acl": {
      "blacklisted": [
        "#~blacklisted" // include users that are blacklisted in the previous element
      ]
    }
  }
}
```

What we want

- A arweb site
- That's a board
- With topics
  - That can have subtopics
  - And posts

- Every site
  - Has a superadministrator (an address) which is an address that can modify certain ACLs that list an owner

Would create a layout that looks like this

```
Board {
  Topic[] topics
}
```
