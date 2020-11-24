import { Message } from '../entities/Message';
import {
   Arg,
   Ctx,
   Field,
   FieldResolver,
   Int,
   Mutation,
   ObjectType,
   PubSub,
   Query,
   Resolver,
   Root,
   Subscription,
} from 'type-graphql';
import { MyContext } from '../utilities/types';
import { User } from '../entities/User';
import { Match } from '../entities/Match';
import { PubSubEngine } from 'graphql-subscriptions';
import { LessThan } from 'typeorm';

@ObjectType()
class UserOutput {
   @Field()
   id!: number;

   @Field()
   username!: string;
}

@ObjectType()
class MessageSubscription {
   @Field()
   id!: number;

   @Field(() => UserOutput)
   user!: UserOutput;

   @Field({ nullable: true })
   text?: string;

   @Field()
   receiverId!: number;

   @Field()
   createdAt!: string;
}

@Resolver(Message)
export class MessageResolver {
   //Queries
   @FieldResolver(() => User)
   async user(@Root() message: Message): Promise<User | null> {
      const user = await User.findOne({
         where: { id: message.userId },
      });

      if (!user) {
         return null;
      }

      user.username =
         user!.username.charAt(0).toUpperCase() + user!.username.slice(1);

      return user;
   }

   @FieldResolver(() => User)
   async receiver(@Root() message: Message): Promise<User | null> {
      const user = await User.findOne({
         where: { id: message.receiverId },
      });

      if (!user) {
         return null;
      }

      user.username =
         user!.username.charAt(0).toUpperCase() + user!.username.slice(1);

      return user;
   }

   @Query(() => [Message])
   async conversation(
      @Arg('receiverId', () => Int) receiverId: number,
      @Arg('cursor', () => String, { nullable: true }) cursor: string | null,
      @Arg('limit', () => Int) limit: number,
      @Ctx() { req }: MyContext
   ): Promise<Message[]> {
      let conversation;
      let cursorToData;

      if (cursor) {
         cursorToData = new Date(parseInt(cursor));
         conversation = await Message.find({
            where: [
               {
                  userId: req.session.userId,
                  receiverId,
                  createdAt: LessThan(cursorToData),
               },
               {
                  userId: receiverId,
                  receiverId: req.session.userId,
                  createdAt: LessThan(cursorToData),
               },
            ],
            order: {
               createdAt: 'DESC',
            },
            take: limit,
         });
      } else {
         conversation = await Message.find({
            where: [
               { userId: req.session.userId, receiverId },
               { userId: receiverId, receiverId: req.session.userId },
            ],
            order: {
               createdAt: 'DESC',
            },
            take: limit,
         });
      }

      return conversation;
   }

   @Query(() => [Message])
   async getAllMessage(): Promise<Message[]> {
      return await Message.find();
   }

   //Mutations
   @Mutation(() => Boolean)
   async message(
      @PubSub() pubSub: PubSubEngine,
      @Arg('message') text: string,
      @Arg('userId', () => Int) userId: number,
      @Ctx() { req }: MyContext
   ) {
      try {
         const match = await Match.findOne({
            where: [
               { user1: req.session.userId, user2: userId },
               { user2: req.session.userId, user1: userId },
            ],
            relations: ['user1', 'user2'],
         });

         if (!match) {
            return false;
         }

         const newMessage = await Message.create({
            text,
            userId: req.session.userId,
            receiverId: userId,
            user:
               match!.user1.id === req.session.userId
                  ? match!.user1
                  : match!.user2,
            receiver:
               match!.user1.id === req.session.userId
                  ? match!.user2
                  : match!.user1,
         }).save();

         // create subscription for new message
         await pubSub.publish('NEW_MESSAGE', newMessage);

         // create subscription for latest message
         await pubSub.publish('LATEST_MESSAGE', {
            id: newMessage.id,
            username:
               match!.user1.id === req.session.userId
                  ? newMessage.receiver.username
                  : newMessage.user.username,
            latestMessage: newMessage.text,
         });

         return true;
      } catch (error) {
         console.log(error);
         return false;
      }
   }

   // Subscriptions
   @Subscription(() => Message, {
      topics: 'NEW_MESSAGE',
   })
   async newMessage(
      @Root() message: MessageSubscription
   ): Promise<MessageSubscription> {
      return message;
   }
}
