import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { env } from './env';
import User, { IUser } from '../models/User';
import logger from '../utils/logger';
import mongoose from 'mongoose';
import Progress from '../models/Progress';

// JWT strategy for authentication
const configureJwtStrategy = () => {
  const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: env.JWT_SECRET
  };

  passport.use(
    new JwtStrategy(options, async (payload, done) => {
      try {
        // Find the user by ID
        const user = await User.findById(payload.id);

        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        logger.error('Error in JWT strategy:', error);
        return done(error, false);
      }
    })
  );
};

// Google OAuth strategy
const configureGoogleStrategy = () => {
  passport.use(
    new GoogleStrategy({
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email']
    }, 
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
          return done(null, existingUser);
        }

        // If not, create a new user
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        
        // Check if user exists with this email
        const userWithEmail = await User.findOne({ email });
        
        if (userWithEmail) {
          // Update existing user with Google ID
          userWithEmail.googleId = profile.id;
          
          if (profile.photos && profile.photos[0]) {
            userWithEmail.profilePicture = profile.photos[0].value;
          }
          
          await userWithEmail.save();
          return done(null, userWithEmail);
        }
        
        // Create new user
        const newUser = await User.create({
          name: profile.displayName,
          email,
          googleId: profile.id,
          profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined
        });

        // Create initial progress record for the user
        await Progress.create({
          user: newUser._id,
          patternsProgress: [],
          quizAttempts: [],
          quizScore: 0,
          totalPatternsViewed: 0
        });

        return done(null, newUser);
      } catch (error) {
        logger.error('Error in Google strategy:', error);
        return done(error as Error, false);
      }
    })
  );
};

// Serialize user into the session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Configure all passport strategies
const configurePassport = () => {
  configureJwtStrategy();
  configureGoogleStrategy();
};

export default configurePassport;