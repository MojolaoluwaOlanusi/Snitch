import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Notification from '../models/Notification.js'
import {User} from '../models/User.js';
import transport from '../middleware/sendMail.js';
import {doHash, doHashValidation, hmacProcess} from '../utils/hashing.js';
import { sendPushNotification } from '../utils/pushNotifications.js';
import Post from "../models/Post.js";
import Report from "../models/Report.js";

const router = express.Router();

function signAccess(id:string){ return jwt.sign({ id }, process.env.JWT_SECRET || 'DevelopmentSecret', { expiresIn: '7d' }); }

function signRefresh(id:string){ return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'DevelopmentRefresh', { expiresIn: '30d' }); }

router.post('/signup', async (req: Request, res: Response)=> {
    const { email, username, password, accountType, displayName } = req.body;

    if(!email||!username||!password||!accountType||!displayName) return res.status(400).json({ error:'missing', message: "Please fill all fields!" });

    const trimmedUsername = username.trim();

    const h = await bcrypt.hash(password, 10);

    try {
        const u = await User.create({ email, trimmedUsername, passwordHash: h, displayName, accountType });
        const access = signAccess(String(u._id));
        const refresh = signRefresh(String(u._id));
        res.json({ access, refresh, user: { id: u._id, username: u.username } });
    } catch(e:any){
        res.status(400).json({ error: e.message });
    }});

router.post('/login', async (req: Request, res: Response)=> {
    const { email, password } = req.body;

    if(!email || !password){
        return res.status(401).json({error: 'invalid', message: "Please fill all fields!"})
    }

    const u = await User.findOne({ email });

    if(!u) return res.status(401).json({ error:'invalid', message: "User not found!" });

    const ok = bcrypt.compareSync(password, u.passwordHash!);

    if(!ok) return res.status(401).json({ error:'invalid', message: "Invalid Password!" });

    if(u.isBanned) return res.status(403).json({ error:'banned', message: "You have been banned!" });

    const access = signAccess(String(u._id));

    const refresh = signRefresh(String(u._id));

    res.json({ access, refresh, user: { id: u._id, username: u.username } });
});

router.post('/refresh', async (req: Request, res: Response) => {
    // const { refreshToken } = req.body;
    // const user = await User.findById(req.userId).select("-passwordHash");
    //
    // if (!refreshToken) {
    //         res.status(401).json({message: "Refresh token is required!"});
    // }
    //
    // if (!signRefresh(refreshToken)) {
    //     res.status(403).json({message: "Refresh token is invalid or expired!"});
    // }
    //
    //
    //
    // // @ts-ignore
    // const access = signAccess(String(user._id));
    // // @ts-ignore
    // const refresh = signRefresh(String(user._id));
    //
    // res.status(200).json({accessToken: access, refreshToken: refresh})

    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token provided" });
        }

        const decoded: any = jwt.verify(refreshToken, process.env.JWT_SECRET || 'DevelopmentSecret');

        const accessToken = signAccess(String({ userId: decoded.userId }));

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
        });

        res.json({ message: "Token refreshed successfully" });
    } catch (err: any) {
        console.log("Error in refreshToken controller", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.post('/signout', (_req: Request, res: Response) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (err: any) {
        console.log("Error in logout controller", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/check", authMiddleware, async (req: Request, res: Response) => {
    res.status(200).json({id: req.userId})
});

router.get('/get-profile',authMiddleware, async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.userId).select("-passwordHash");
        res.status(200).json(user);
    } catch (err: any) {
        console.error('Error in getUserProfile:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.get('/get-user-profile/:username', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({
            usernameLower: username.toLowerCase()
        }).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (err: any) {
        console.error('Error in getUserProfile:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.put('/update-profile',authMiddleware, async (req: Request, res: Response) => {
    try {
        const { email, username, gender, socialHandles, theme, displayName, bio, avatarUrl, coverImg, accountType, accountVisibility, link, location } = req.body;
        const user = await User.findById(req.userId).select("-passwordHash");
        const trimmedUsername = username.trim();
        const updatedProfile = await User.findByIdAndUpdate(
            // @ts-ignore
            user._id,
            { email , trimmedUsername, displayName, bio, avatarUrl, gender, socialHandles, theme, accountType, coverImg, link, location, accountVisibility },
            { new: true }
        ).select("-passwordHash");
        res.status(200).json(updatedProfile);
    } catch (err: any) {
        console.error('Error in getUserProfile:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.get('/bookmarks', authMiddleware, async (req: Request, res: Response) => {
    const user = await User.findById(req.userId).populate('bookmarkedPosts');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.bookmarkedPosts);
});

router.delete('/account', authMiddleware, async (req: Request, res: Response) => {
    // Optionally verify password before deletion
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Perform cleanup (messages, posts, etc.) as needed
    await User.findByIdAndDelete(req.userId);
    res.json({ message: 'Account deleted' });
});

router.post('/send-verification-code', async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.verified) return res.status(400).json({ success: false, message: 'Already verified' });

        const code = Math.floor(100000 + Math.random() * 900000).toString();// 6 digits
        const htmlContent =  `
          <div style="
              font-family: system-ui, -apple-system, sans-serif;
              background: linear-gradient(135deg, #1e3a8a, #2563eb, #60a5fa);
              color: white;
              text-align: center;
              padding: 40px 20px;
              border-radius: 12px;
          ">
              <!-- Logo -->
              <div style="margin-bottom: 20px;">
                  <svg viewBox="0 0 100 100" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                          <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stop-color="#1e3a8a" />
                              <stop offset="50%" stop-color="#2563eb" />
                              <stop offset="100%" stop-color="#60a5fa" />
                          </linearGradient>
                      </defs>
                      <path
                          d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z"
                          fill="url(#hexGradient)"
                      />
                      <text
                          x="50"
                          y="68"
                          text-anchor="middle"
                          fill="white"
                          font-size="48"
                          font-family="system-ui, -apple-system, sans-serif"
                          font-weight="900"
                      >
                          SNITCH
                      </text>
                  </svg>
              </div>
        
              <h1 style="font-size: 28px; margin-bottom: 10px;">Email Verification</h1>
              <p style="font-size: 16px; opacity: 0.9; margin-bottom: 30px;">
                  Please use the code below to verify your Snitch account.
              </p>
        
              <div style="
                  display: inline-block;
                  background: white;
                  color: #1e3a8a;
                  font-size: 32px;
                  font-weight: bold;
                  letter-spacing: 4px;
                  padding: 15px 30px;
                  border-radius: 8px;
                  margin-bottom: 30px;
              ">
                  ${code}
              </div>
        
              <p style="font-size: 14px; opacity: 0.8;">
                  This code will expire in 5 minutes. If you didn’t request this, please ignore this email.
              </p>
          </div>
          `;
        // Save hashed code and timestamp as Date
        user.verificationCode = hmacProcess(code);
        user.verificationCodeValidation = new Date();
        await user.save();


        await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: email,
            subject: 'Your Snitch verification code',
            html: htmlContent,
        });

        return res.json({ success: true, message: 'Code sent' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/verify-verification-code', async (req: Request, res: Response) => {
    const { email, providedCode } = req.body;
    if (!email || !providedCode) return res.status(400).json({ success: false, message: 'Missing params' });

    try {
        const user = await User.findOne({ email }).select('+verificationCode +verificationCodeValidation');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.verified) return res.status(400).json({ success: false, message: 'Already verified' });
        if (!user.verificationCode || !user.verificationCodeValidation) return res.status(400).json({ success: false, message: 'No code exists, request a new one' });

        const validationTs = user.verificationCodeValidation instanceof Date
            ? user.verificationCodeValidation.getTime()
            : Number(user.verificationCodeValidation);

        if (Date.now() - validationTs > 10 * 60 * 1000) {
            // expired: clear fields
            user.verificationCode = undefined;
            user.verificationCodeValidation = undefined;
            await user.save();
            return res.status(400).json({ success: false, message: 'Code expired' });
        }

        const hashedProvided = hmacProcess(String(providedCode));
        if (hashedProvided !== user.verificationCode) return res.status(400).json({ success: false, message: 'Invalid code' });

        user.verified = true;
        user.verificationCode = undefined;
        user.verificationCodeValidation = undefined;
        await user.save();
        return res.json({ success: true, message: 'Account verified' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/send-forgot-password-code', async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const htmlContent =  `
          <div style="
              font-family: system-ui, -apple-system, sans-serif;
              background: linear-gradient(135deg, #1e3a8a, #2563eb, #60a5fa);
              color: white;
              text-align: center;
              padding: 40px 20px;
              border-radius: 12px;
          ">
              <!-- Logo -->
              <div style="margin-bottom: 20px;">
                  <svg viewBox="0 0 100 100" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                          <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stop-color="#1e3a8a" />
                              <stop offset="50%" stop-color="#2563eb" />
                              <stop offset="100%" stop-color="#60a5fa" />
                          </linearGradient>
                      </defs>
                      <path
                          d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z"
                          fill="url(#hexGradient)"
                      />
                      <text
                          x="50"
                          y="68"
                          text-anchor="middle"
                          fill="white"
                          font-size="48"
                          font-family="system-ui, -apple-system, sans-serif"
                          font-weight="900"
                      >
                          SNITCH
                      </text>
                  </svg>
              </div>
        
              <h1 style="font-size: 28px; margin-bottom: 10px;">Email Verification</h1>
              <p style="font-size: 16px; opacity: 0.9; margin-bottom: 30px;">
                  Please use the code below to verify your Snitch account.
              </p>
        
              <div style="
                  display: inline-block;
                  background: white;
                  color: #1e3a8a;
                  font-size: 32px;
                  font-weight: bold;
                  letter-spacing: 4px;
                  padding: 15px 30px;
                  border-radius: 8px;
                  margin-bottom: 30px;
              ">
                  ${code}
              </div>
        
              <p style="font-size: 14px; opacity: 0.8;">
                  This code will expire in 5 minutes. If you didn’t request this, please ignore this email.
              </p>
          </div>
          `;
        user.forgotPasswordCode = hmacProcess(code);
        user.forgotPasswordCodeValidation = new Date();
        await user.save();


        await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: email,
            subject: 'Your password reset code',
            html: htmlContent,
        });

        res.json({ success: true, message: 'Reset code sent' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/verify-forgot-password-code', async (req: Request, res: Response) => {
    const { email, providedCode, newPassword } = req.body;
    if (!email || !providedCode || !newPassword) return res.status(400).json({ success: false, message: 'Missing params' });

    try {
        const user = await User.findOne({ email }).select('+forgotPasswordCode +forgotPasswordCodeValidation +passwordHash');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!user.forgotPasswordCode || !user.forgotPasswordCodeValidation) {
            return res.status(400).json({ success: false, message: 'No reset code exists' });
        }

        const validationTs = user.forgotPasswordCodeValidation instanceof Date
            ? user.forgotPasswordCodeValidation.getTime()
            : Number(user.forgotPasswordCodeValidation);

        if (Date.now() - validationTs > 10 * 60 * 1000) {
            user.forgotPasswordCode = undefined;
            user.forgotPasswordCodeValidation = undefined;
            await user.save();
            return res.status(400).json({ success: false, message: 'Code expired' });
        }

        const hashedProvided = hmacProcess(String(providedCode));
        if (hashedProvided !== user.forgotPasswordCode) return res.status(400).json({ success: false, message: 'Invalid code' });

        // change password
        user.passwordHash = await doHash(newPassword, 12);
        user.forgotPasswordCode = undefined;
        user.forgotPasswordCodeValidation = undefined;
        await user.save();

        res.json({ success: true, message: 'Password updated' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.patch('/change-password', authMiddleware, async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ success: false, message: 'Missing params' });

    try {
        const user = await User.findById((req as any).userId).select('+passwordHash');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const ok = await doHashValidation(oldPassword, user.passwordHash);
        if (!ok) return res.status(401).json({ success: false, message: 'Invalid current password' });

        user.passwordHash = await doHash(newPassword, 12);
        await user.save();

        res.json({ success: true, message: 'Password changed' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/follow', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { id: userToModifyId } = req.body;
        const userToModify = await User.findById(userToModifyId);
        const currentUser = await User.findById(req.userId);

        if (!userToModifyId) {
            return res.status(400).json({ error: "UserId is required", message: "UserId is required!" });
        }

        if (userToModifyId === req.userId) {
            return res.status(400).json({ error: "You can't follow/unfollow yourself", message: "You can't follow/unfollow yourself" });
        }

        if (!userToModify || !currentUser) {
            return res.status(400).json({ error: "User not found", message: "User not found!" });
        }

        // @ts-ignore
        const isFollowing = currentUser.following.includes(userToModifyId);

        if (isFollowing) {
            // Unfollow the user
            await User.findByIdAndUpdate(userToModifyId, { $pull: { followers: req.userId } });
            await User.findByIdAndUpdate(req.userId, { $pull: { following: userToModifyId } });
            await User.findByIdAndUpdate(currentUser, { $inc: { followingCount: -1 } }).catch(() => {});
            await User.findByIdAndUpdate(userToModifyId, { $inc: { followerCount: -1 } }).catch(() => {});
            res.status(200).json({ message: "User unfollowed successfully", id: userToModifyId });
        } else {
            // Follow the user
            await User.findByIdAndUpdate(userToModifyId, { $push: { followers: req.userId } });
            await User.findByIdAndUpdate(req.userId, { $push: { following: userToModifyId } });

            // Create notification
            const newNotification = new Notification({
                type: "follow",
                from: req.userId,
                to: userToModifyId,
                fromAvatarUrl: currentUser.avatarUrl,
            });
            await newNotification.save();

            // 🔔 Send push notification
            sendPushNotification(userToModifyId, {
                title: 'New Follower',
                body: `${currentUser.displayName || currentUser.username} followed you`,
                url: `${process.env.CLIENT_URL}/profile/${currentUser.username}`,
            }).catch(err => console.error('Push follow notification error:', err));

            await User.findByIdAndUpdate(currentUser, { $inc: { followingCount: 1 } }).catch(() => {});
            await User.findByIdAndUpdate(userToModifyId, { $inc: { followerCount: 1 } }).catch(() => {});

            res.status(200).json({ message: "User followed successfully", id: userToModifyId });
        }
    } catch (err: any) {
        console.log("Error in followUnfollowUser: ", err.message);
        res.status(500).json({ error: err.message, message: err });
    }
});

router.get('/get-suggested-users', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        const usersFollowedByMe = await User.findById(userId).select("following");

        if (!usersFollowedByMe) return res.status(400).json({ error: "You are not following any user" });

        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: userId },
                },
            },
            { $sample: { size: 10 } },
        ]);

        // 1,2,3,4,5,6,
        const filteredUsers = users.filter((user) => !usersFollowedByMe.following.includes(user._id));

        const suggestedUsers = filteredUsers.slice(0, 4);

        suggestedUsers.forEach((user) => (user.passwordHash = null));

        res.status(200).json(suggestedUsers);
    } catch (err: any) {
        console.log("Error in getSuggestedUsers: ", err.message);
        res.status(500).json({ error: err.message, message: err });
    }
});

router.get('/get-followers', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        const Followers = await User.findById(userId).select("followers");

        res.status(200).json(Followers);
    } catch (err: any) {
        console.log("Error in getFollowers: ", err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/get-following', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        const Following = await User.findById(userId).select("following");

        res.status(200).json(Following);
    } catch (err: any) {
        console.log("Error in getFollowing: ", err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post('/report/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const report = await Report.create({
            postId: id,
            reportedBy: req.userId,
            reason,
            createdAt: new Date()
        });

        const post = await Post.findById(id);
        if (post) {
            const updatedPost = await Post.findByIdAndUpdate(
                id,
                { $inc: { reportCount: 1 } },
                { new: true }
            );

            // FIX: Add null check with optional chaining and default to 0
            const reportCount = updatedPost?.reportCount ?? 0;

            if (updatedPost && reportCount >= 10) {
                await Post.findByIdAndDelete(id);
            }

            try {
                const io = (globalThis as any).io;
                if (io) io.emit('post:reported', { id, reports: reportCount });
            } catch (e) {
                console.log(e);
            }
        }

        res.json({ ok: true, report });
    } catch (err: any) {
        console.error("Error in report route:", err.message);
        res.status(500).json({ error: err.message || "Server error" });
    }
});

router.get('/reports', authMiddleware, async (_req: Request, res: Response) => {
    const reports = await Report.find()
        .populate('postId', 'author text')
        .populate('reportedBy', 'email username')
        .sort({ createdAt: -1 });
    res.json(reports);
});

router.post('/block/:id', authMiddleware, async (req: Request, res: Response) => {
    const { id: userToModifyId } = req.params;
    const currentUser = await User.findById(req.userId);

    if (!currentUser) return res.status(400).json({ error: "No CurrentUser found!", message: "No current User Found!"});

    if (!userToModifyId) return res.status(400).json({ error: "No User to block found!", message: "No User to block Found!"});

    try {
        await User.findByIdAndUpdate(userToModifyId, { $push: { blockedBy: currentUser } });
        await User.findByIdAndUpdate(currentUser, { $push: { blocked: userToModifyId } });
        res.status(200).json({success: true, message: `You have successfully blocked the User`})
    } catch (err: any) {
        console.log("Error in blocking user: ", err.message);
        res.status(500).json({ error: err.message });
    }

});

router.post('/unblock/:id', authMiddleware, async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser = req.userId;

    if (!currentUser) return res.status(400).json({ error: "No CurrentUser found!", message: "No current User Found!"});

    if (!id) return res.status(400).json({ error: "No User to block found!", message: "No User to block Found!"});

    try {
        await User.findByIdAndUpdate(id, { $pull: { blockedBy: currentUser } });
        await User.findByIdAndUpdate(currentUser, { $pull: { blocked: id } });
        res.status(200).json({success: true, message: `You have successfully unblocked the User`})
    } catch (err: any) {
        console.log("Error in blocking user: ", err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/get-user-by-username/:username', authMiddleware, async (req: Request, res: Response) => {
    const { username } = req.params;
    const user = await User.findOne({username});
    res.json(user);
});

router.get('/get-user-by-id/:id', authMiddleware, async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await User.findById(id).select("-passwordHash");
    res.json(user);
});

router.get('/get-users', authMiddleware, async (_req: Request, res: Response) => {
    const users = await User.find({}, 'username');
    res.json(users);
});

// Report a user (from chat)
router.post('/report-user/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const reportedUser = await User.findById(id);
        if (!reportedUser) return res.status(404).json({ error: "User not found" });

        const currentCount: number = (reportedUser as any).chatReportCount || 0;
        const newCount: number = currentCount + 1;
        (reportedUser as any).chatReportCount = newCount;

        if (newCount >= 100) {
            await User.findByIdAndDelete(id);
            return res.json({ success: true, message: "User reported and removed" });
        } else if (newCount >= 50) {
            (reportedUser as any).chatRestrictedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        } else if (newCount >= 20) {
            (reportedUser as any).chatRestrictedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
        await reportedUser.save();

        res.status(200).json({ success: true, message: "User reported successfully" });
    } catch (error: any) {
        console.error("Error reporting user:", error);
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Save push subscription
router.post('/push-subscription', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { subscription } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Avoid duplicates
        const exists = user.pushSubscriptions?.some(
            (s: any) => s.endpoint === subscription.endpoint
        );
        if (!exists) {
            user.pushSubscriptions = user.pushSubscriptions || [];
            (user.pushSubscriptions as any[]).push(subscription);
            await user.save();
        }
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Remove push subscription
router.delete('/push-subscription', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { endpoint } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        (user.pushSubscriptions as any[]).filter(
            (s: any) => s.endpoint !== endpoint
        );
        await user.save();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

async function authMiddleware(req: Request, res: Response, next: any) {
    const h = req.headers.authorization;
    if (!h) return res.status(400).json({error: 'unauthorized'});
    try {
        const token = h.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'DevelopmentSecret');
        req.userId = decoded.id;
        next();
    } catch (e) {
        console.log(`An exception occurred: ${e}`)
        return res.status(401).json({error: 'unauthorized'})
    }
}
// @ts-ignore
export default router;