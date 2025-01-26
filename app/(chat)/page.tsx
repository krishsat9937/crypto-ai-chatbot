import { cookies } from 'next/headers';
import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { ClearSessionStorage } from '@/components/clear-session-storage';
import { generateTitleFromUserMessage } from './actions';
import { saveChat, saveMessages } from '@/lib/db/queries';
import { Message } from 'ai';

export default async function Page() {
  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  // To save initial welcome message
  const staticMessages: any = [
    {
      id: generateUUID(),
      createdAt: new Date(),
      role: 'assistant',
      content: 'Good Day',
    },
    {
      id: generateUUID(),
      createdAt: new Date(),
      role: 'assistant',
      content: 'Do you have an account or would you like to create one?',
    },
  ];
  const title = await generateTitleFromUserMessage({ message: staticMessages });
  await saveChat({ id, title });
  await saveMessages({
    messages: [
      { ...staticMessages[0], id: generateUUID(), createdAt: new Date(), chatId: id },
    ],
  }); 
  await saveMessages({
    messages: [
      { ...staticMessages[1], id: generateUUID(), createdAt: new Date(), chatId: id },
    ],
  }); 
  // await Promise.all(staticMessages.map(async (message: Message)=>{
  //   let userMessageId =  generateUUID();
  //   return await saveMessages({
  //     messages: [
  //       { ...message, id: userMessageId, createdAt: new Date(), chatId: id },
  //     ],
  //   });
  // }));

  return (
    <>
      {/* <ClearSessionStorage /> */}
      <Chat
        key={id}
        id={id}
        initialMessages={staticMessages}
        selectedModelId={selectedModelId}
        selectedVisibilityType="private"
        isReadonly={false}
      />
    </>
  );
}
