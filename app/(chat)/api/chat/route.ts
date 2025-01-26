import {
  type Message,
  StreamData,
  convertToCoreMessages,
  streamText,
} from 'ai';
import { z } from 'zod';

import { customModel } from '@/lib/ai';
import { models } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  createUser,
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  updateChatById
} from '@/lib/db/queries';
import { auth } from '@clerk/nextjs/server';


import { createClerkUserWithSkipPassword } from '@/lib/clerk_util';

import {
  generateUUID,
  getAssitantMessage,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { findTurnkeyUserByEmailAddress } from '@/lib/db/turnkey_queries/queries';
import { generateTitleFromUserMessage } from '../../actions';
import { setupTurnKeySubOrgAndWallet } from '@/lib/turnkey';

export const maxDuration = 60;

type AllowedTools =
  | 'createUserWithSkipPassword'
  | 'sendLoginOTP'
  | 'processEmailOTP'
  | 'handleTurnkeyAccountAction';

const blocksTools: AllowedTools[] = [
  // 'checkIfUserExists',
  'createUserWithSkipPassword',
  'sendLoginOTP',
  'processEmailOTP',
  'handleTurnkeyAccountAction',
];

const allTools: AllowedTools[] = blocksTools;

function sanitizeMessages(messages: any) {
  return messages.map((message: any) => ({
    ...message,
    content: message.content || '[Empty Content]', // Replace null or undefined content
  }));
}

function validateMessages(messages: any) {
  return messages.every(
    (message: any) =>
      message &&
      typeof message.content === 'string' &&
      message.content.trim() !== '',
  );
}

export async function POST(request: Request) {
  const {
    id,
    messages,
    modelId,
  }: { id: string; messages: Array<Message>; modelId: string } =
    await request.json();


  let { userId: clerkUserID } = await auth();
  let userId = null;

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('Model not found', { status: 404 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const sanitizedCoreMessages = sanitizeMessages(coreMessages);

  const assistantMessage = getAssitantMessage(coreMessages);
  if (assistantMessage) {
    try {
      const chat = await getChatById({ id });
      if (!chat) {
        const title = await generateTitleFromUserMessage({ message: assistantMessage });
        await saveChat({ id, userId, title });
      }

      const userMessageId = generateUUID();

      await saveMessages({
        messages: [
          { ...assistantMessage, id: userMessageId, createdAt: new Date(), chatId: id },
        ],
      });
      return new Response('Assistant message saved', { status: 200 });
    } catch (error) {
      return new Response('An error occurred while processing your request', {
        status: 500,
      });
    }

  }

  // if (clerkUserID) {
  //   const chat = await getChatById({ id });
  //   if (!chat.userId) {
  //     const user = await findUserIdByClerkId(clerkUserID);
  //     if (user.length === 1) {
  //       await updateChatById({ id, userId: user[0].id });
  //     }
  //   }
  // }

  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId, title });
  }

  const userMessageId = generateUUID();

  await saveMessages({
    messages: [
      { ...userMessage, id: userMessageId, createdAt: new Date(), chatId: id },
    ],
  });

  const streamingData = new StreamData();

  streamingData.append({
    type: 'user-message-id',
    content: userMessageId,
  });

  const result = streamText({
    model: customModel(model.apiIdentifier),
    system: systemPrompt,
    messages: sanitizedCoreMessages,
    maxSteps: 5,
    experimental_activeTools: allTools as ("createUserWithSkipPassword" | "sendLoginOTP" | "processEmailOTP" | "handleTurnkeyAccountAction")[],
    tools: {
      createUserWithSkipPassword: {
        description: 'Create a new user with email and skip password',
        parameters: z.object({
          email: z.string().email(),
        }),
        execute: async (email_object: any) => {
          console.log("Create a new user with email and skip password called");
          const { email } = email_object;
          const res = await createClerkUserWithSkipPassword(email);
          if (res) {
            const newUser = await createUser(res.id, email, res.first_name, res.last_name, '');
            console.log("new user created", newUser);
            // update chat with user id

            const chat = await getChatById({ id });
            if (chat) {
              await updateChatById({ id, userId: newUser.createdId, title: chat.title });
            }
            return 'User created successfully with email: ' + email + '. Do you want to login?';
          }
        },
      },
      sendLoginOTP: {
        description: 'Send a login email link to the user via email',
        parameters: z.object({
          email: z.string().email(),
        }),
        execute: (async (email_object: any) => {
          const { email } = email_object;
          console.log("Send a login email link to the user via email called");
          return email;
        }),
      },
      processEmailOTP: {
        description: 'Process the OTP sent to the user via email',
        parameters: z.object({
          otp: z.string().length(6),
        }),
        execute: async (otp_object: any) => {
          console.log("Process the OTP sent to the user via email called");
          const { otp } = otp_object;
          return otp;
        },
      },
      handleTurnkeyAccountAction: {
        description: 'Handle the action for turnkey account',
        parameters: z.object({
          email: z.string().email(),
        }),
        execute: async (email_object: any) => {
          console.log("Handle the action for turnkey account called");
          const { email } = email_object;

          const if_user_exists = await findTurnkeyUserByEmailAddress(email);
          console.log("if_user_exists", if_user_exists);
          if (if_user_exists.length > 0) {
            return 'Turnkey User with email ' + email + ' exists. How can I help you?';
          } else {

            try {
              // generate org name, wallet name, rootuser name from email
              const orgName = `${email.split('@')[0]} Organization`;
              const walletName = `${email.split('@')[0]} Wallet`;
              const rootUser = {
                userName: email.split('@')[0],
                userEmail: email,
              };

              const response = await setupTurnKeySubOrgAndWallet(orgName, walletName, rootUser);
              console.log("Turnkey response:", response);
              return 'Turnkey account created successfully for ' + email;
            }catch (error) {
              return 'Failed to create Turnkey account for ' + email;
            }          
          }
        },
      },
    },
    onFinish: async ({ response }) => {
      try {
        const responseMessagesWithoutIncompleteToolCalls =
          sanitizeResponseMessages(response.messages);

        await saveMessages({
          messages: responseMessagesWithoutIncompleteToolCalls.map(
            (message) => {
              const messageId = generateUUID();

              if (message.role === 'assistant') {
                streamingData.appendMessageAnnotation({
                  messageIdFromServer: messageId,
                });
              }

              return {
                id: messageId,
                chatId: id,
                role: message.role,
                content: message.content,
                createdAt: new Date(),
              };
            },
          ),
        });
      } catch (error) {
        console.error('Failed to save chat:', error);
        streamingData.close();
      } finally {
        streamingData.close();
      }
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'stream-text',
    },
  });

  return result.toDataStreamResponse({
    data: streamingData,
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
