// spammer backend

import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

const prisma = new PrismaClient();
const app = express();

// allow requests from deployed frontend on netlify domain
app.use(
  cors({
    origin:
      "https://64feefde5cf4cf60fa183520--stellular-cassata-1a9cf0.netlify.app",
  })
);

// middleware that converts JSON to object
app.use(express.json());

// GET request handler
app.get("/messages", async (req, res) => {
  // if req.body has something inside the {}, stop processing GET
  if (Object.keys(req.body).length !== 0) {
    return res
      .status(400)
      .json({ success: false, error: "GET request should not contain a body" });
  }
  // use prisma to return all messages in DB with the selected properties included
  const messages = await prisma.message.findMany({
    where: { parentId: null },
    select: {
      id: true,
      createdAt: true,
      text: true,
      parentId: true,
      likes: true,
      children: {
        select: {
          id: true,
          createdAt: true,
          text: true,
          parentId: true,
          likes: true,
          children: {
            select: {
              id: true,
              createdAt: true,
              text: true,
              parentId: true,
              likes: true,
              children: {
                select: {
                  id: true,
                  createdAt: true,
                  text: true,
                  parentId: true,
                  likes: true,
                  children: {
                    select: {
                      id: true,
                      createdAt: true,
                      text: true,
                      parentId: true,
                      likes: true,
                      children: {
                        select: {
                          id: true,
                          createdAt: true,
                          text: true,
                          parentId: true,
                          likes: true,
                          children: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  // format GET response data per API docs
  res.json({ success: true, messages });
});

// POST request handler
app.post("/messages", async (req, res) => {
  try {
    // if req.body is an empty {} or non-existant {}
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: "POST request requires a body with a text key",
      });
    }
    // check for erroneous keys
    const validKeys = ["text", "parentId"]; // valid keys for POST request
    for (const key in req.body) {
      if (!validKeys.includes(key)) {
        return res.status(400).json({
          success: false,
          error: "POST request body contains an erroneous key",
        });
      }
    }
    // deconstruct keys from req.body; text is required; parentId is optional
    const { text, parentId } = req.body;
    // if text key isn't present then return unsuccessful per API docs
    if (!text) {
      return res.status(400).json({
        success: false,
        error: "POST request requires a text key",
      });
    }
    // if parentId exists in the request then process further
    if (parentId) {
      // check if parentId is a string
      if (typeof parentId !== "string") {
        return res.status(400).json({
          success: false,
          error: "POST request parentId value is not of type string",
        });
      }
      // check if any message ids in the database match parentId
      const findParentId = await prisma.message.findUnique({
        where: { id: parentId },
      });
      // if no messages in the DB have an id with same value as parentId then fail
      if (!findParentId) {
        return res.status(400).json({
          success: false,
          error: "POST request contains invalid parentId value",
        });
      }
    }
    // check if key values are of the correct type
    if (typeof text !== "string") {
      return res.status(400).json({
        success: false,
        error: "POST request text-key contains a value of the wrong type",
      });
    }
    // add the message to the database using prisma
    const newMessage = await prisma.message.create({
      data: { text, parentId },
    });
    // format and send the POST response per API docs
    res.json({ success: true, message: newMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "error occurred while processing the POST request.",
    });
  }
});

// PUT request handler
app.put("/messages/:messageId", async (req, res) => {
  try {
    // if req.body is an empty {} or non-existant {}
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: "PUT request requires a body",
      });
    }
    // deconstruct messageId from request parameters
    const { messageId } = req.params;
    // check if message id is in URL path
    if (!messageId) {
      return res.status(400).json({
        success: false,
        error: "PUT request requires a message id in URL path",
      });
    }
    // check if message id exists in the database
    const messageWithId = await prisma.message.findUnique({
      where: { id: messageId },
    });
    // if there's no message id in DB then return unsuccessful
    if (!messageWithId) {
      return res.status(400).json({
        success: false,
        error: "PUT request message id is not listed in the database",
      });
    }
    // check for erroneous keys sent as part of PUT request body per API docs
    const validKeys = ["text", "likes"]; // valid optional keys for POST request
    for (const key in req.body) {
      if (!validKeys.includes(key)) {
        return res.status(400).json({
          success: false,
          error: "PUT request body contains an erroneous key",
        });
      }
    }
    // deconstruct variables from request body; text and likes are optional per API docs
    const { text, likes } = req.body;
    // check if text is included in the body and is not a string
    if (text && typeof text !== "string") {
      return res.status(400).json({
        success: false,
        error: "PUT request text-key contains a value of the wrong type",
      });
    }
    // check if likes is included in the body and is not a number
    if (likes && typeof likes !== "number") {
      return res.status(400).json({
        success: false,
        error: "PUT request likes-key contains a value of the wrong type",
      });
    }
    // use prisma to update the database
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { text, likes },
    });
    // send the PUT response formatted per API docs
    res.json({ sucess: true, message: updatedMessage });
  } catch {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "error occurred while processing the PUT request.",
    });
  }
});

// DELETE request handler
app.delete("/messages/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    // check if a messageId exists in the URL path
    if (!messageId) {
      return res.status(400).json({
        success: false,
        error: "message id was not included in delete request URL path",
      });
    }
    // if req.body has something inside the {}, stop processing DELETE
    if (Object.keys(req.body).length !== 0) {
      return res.status(400).json({
        success: false,
        error: "DELETE request should not contain a body",
      });
    }
    // check if message id exists in the database
    const messageWithId = await prisma.message.findUnique({
      where: { id: messageId },
    });
    // if there's no message id in DB then return unsuccessful
    if (!messageWithId) {
      return res.status(400).json({
        success: false,
        error: "PUT request message id is not listed in the database",
      });
    }
    // use prisma to delete the message from the DB
    const deletedMessage = await prisma.message.delete({
      where: {
        id: messageId,
      },
    });
    // send the delete response formatted per API docs
    res.json({ sucess: true, message: deletedMessage });
  } catch {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "error occurred while processing the DELETE request.",
    });
  }
});

// error handling for incorrect request url
app.use((req, res) => {
  res.send({ success: false, error: "No route found." });
});

// express error handling
app.use((error, req, res, next) => {
  res.send({ success: false, error: error.message });
});

// catch wrong method with an existing url
app.all("*", function (req, res) {
  throw new Error("Bad request");
});

const server = app.listen(3000);
