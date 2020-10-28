import { Message } from '../entities/Message';
import { Arg, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql';
import { MyContext } from '../utilities/types';
import { User } from '../entities/User';

@Resolver(Message)
export class MessageResolver {
   //Queries
   @Query(() => [Message])
   async conversation(
      @Arg('receiverId') receiverId: String,
      @Ctx() { req }: MyContext
   ): Promise<Message[]> {
      return Message.find({
         where: { userId: req.session.userId, receiverId },
      });
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
         console.log(error.message);
         return false;
      }
   }
}
