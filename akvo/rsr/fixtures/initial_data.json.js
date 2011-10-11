[
  {
    "pk": 1,
    "model": "workflows.workflow",
    "fields": {
      "initial_state": 4,
      "name": "SMS update"
    }
  },
  {
    "pk": 4,
    "model": "workflows.state",
    "fields": {
      "transitions": [
        4
      ],
      "name": "Phone disabled",
      "workflow": 1
    }
  },
  {
    "pk": 1,
    "model": "workflows.state",
    "fields": {
      "transitions": [
        2
      ],
      "name": "Phone number added",
      "workflow": 1
    }
  },
  {
    "pk": 3,
    "model": "workflows.state",
    "fields": {
      "transitions": [
        3
      ],
      "name": "Updates enabled",
      "workflow": 1
    }
  },
  {
    "pk": 2,
    "model": "workflows.transition",
    "fields": {
      "permission": 1,
      "destination": 3,
      "name": "Enable updating",
      "condition": "",
      "workflow": 1
    }
  },
  {
    "pk": 3,
    "model": "workflows.transition",
    "fields": {
      "permission": 1,
      "destination": 4,
      "name": "Disable updating",
      "condition": "",
      "workflow": 1
    }
  },
  {
    "pk": 4,
    "model": "workflows.transition",
    "fields": {
      "permission": 2,
      "destination": 1,
      "name": "Add phone number",
      "condition": "",
      "workflow": 1
    }
  },
  {
    "pk": 2,
    "model": "workflows.workflowpermissionrelation",
    "fields": {
      "permission": 2,
      "workflow": 1
    }
  },
  {
    "pk": 3,
    "model": "workflows.workflowpermissionrelation",
    "fields": {
      "permission": 1,
      "workflow": 1
    }
  },
  {
    "pk": 1,
    "model": "workflows.statepermissionrelation",
    "fields": {
      "state": 1,
      "role": 2,
      "permission": 2
    }
  },
  {
    "pk": 3,
    "model": "workflows.statepermissionrelation",
    "fields": {
      "state": 3,
      "role": 2,
      "permission": 2
    }
  },
  {
    "pk": 4,
    "model": "workflows.statepermissionrelation",
    "fields": {
      "state": 4,
      "role": 2,
      "permission": 2
    }
  },
  {
    "pk": 5,
    "model": "workflows.statepermissionrelation",
    "fields": {
      "state": 1,
      "role": 1,
      "permission": 1
    }
  },
  {
    "pk": 7,
    "model": "workflows.statepermissionrelation",
    "fields": {
      "state": 3,
      "role": 1,
      "permission": 1
    }
  },
  {
    "pk": 1,
    "model": "permissions.permission",
    "fields": {
      "content_types": [
        28
      ],
      "codename": "add_sms_updates",
      "name": "Add SMS updates"
    }
  },
  {
    "pk": 2,
    "model": "permissions.permission",
    "fields": {
      "content_types": [
        28
      ],
      "codename": "manage_sms_updates",
      "name": "Manage SMS updates"
    }
  },
  {
    "pk": 2,
    "model": "permissions.role",
    "fields": {
      "name": "SMS manager"
    }
  },
  {
    "pk": 1,
    "model": "permissions.role",
    "fields": {
      "name": "SMS updater"
    }
  },
  {
    "pk": 1,
    "model": "gateway.gateway",
    "fields": {
      "sender": "sender",
      "timestamp": "delivered",
      "msg_id": "incsmsid",
      "send_path": "/api/current/send/message.php",
      "receiver": "to",
      "host_name": "server2.msgtoolbox.com",
      "message": "text",
      "name": "42it"
    }
  },
  {
    "pk": 1,
    "model": "gateway.gatewaynumber",
    "fields": {
      "gateway": 1,
      "number": "467301203262115"
    }
  },
  {
    "pk": 2,
    "model": "gateway.gatewaynumber",
    "fields": {
      "gateway": 1,
      "number": "46731233400"
    }
  },
  {
     "pk": 63,
     "model": "oembed.storedprovider",
     "fields": {
       "regex": "http://blip.tv/\\S*/\\S*",
       "wildcard_regex": "http://blip.tv/*/*",
       "provides": false,
       "active": true,
       "endpoint_url": "http://api.embed.ly/v1/api/oembed",
       "resource_type": "video"
     }
   }
]