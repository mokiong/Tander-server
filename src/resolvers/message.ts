import { Message } from '../entities/Message';
import {
   Arg,
   Ctx,
   FieldResolver,
   Int,
   Mutation,
   Query,
   Resolver,
   Root,
} from 'type-graphql';
import { MyContext } from '../utilities/types';
import { User } from '../entities/User';

@Resolver(Message)
export class MessageResolver {
   //Queries
   @FieldResolver(() => String)
   async matchUsername(@Root() message: Message) {
      const user = await User.findOne({
         where: { id: message.receiverId },
         select: ['username'],
      });

      if (!user) {
         return null;
      }

      const capitalizedUsername =
         user!.username.charAt(0).toUpperCase() + user!.username.slice(1);

      return capitalizedUsername;
   }

   @Query(() => [Message])
   async conversation(
      @Arg('receiverId', () => Int) receiverId: number,
      @Ctx() { req }: MyContext
   ): Promise<Message[]> {
      return Message.find({
         where: [
            { userId: req.session.userId, receiverId },
            { userId: receiverId, receiverId: req.session.userId },
         ],
      });
   }

   @Query(() => [Message])
   async getAllMessage(): Promise<Message[]> {
      return await Message.find();
   }

   //Mutations
   @Mutation(() => Boolean)
   async message(
      @Arg('message') text: string,
      @Arg('userId', () => Int) userId: number,
      @Ctx() { req }: MyContext
   ) {
      try {
         const user = await User.findOne({ id: req.session.userId });
         const receiver = await User.findOne({ id: userId });

         await Message.create({
            text,
            user,
            receiver,
         }).save();

         return true;
      } catch (error) {
         console.log(error);
         return false;
      }
   }
}
