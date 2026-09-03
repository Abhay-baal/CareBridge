const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const Family = require("../models/Family");
const User = require("../models/User");
const SupportTicket = require("../models/SupportTicket");
const Announcement = require("../models/Announcement");

const Message = require("../models/Message");
const Booking = require("../models/Booking");
const EmergencyEvent = require("../models/EmergencyEvent");

const { sendEmail } = require("../config/mailer");

const getOwnerConfig = () => ({
  accessKeyHash: process.env.OWNER_ACCESS_KEY_HASH,
  username: process.env.OWNER_USERNAME,
  passwordHash: process.env.OWNER_PASSWORD_HASH,
});

const ownerLogin = async (req, res) => {
  try {
    const { accessKey, username, password } = req.body;

    const {
      accessKeyHash,
      username: expectedUsername,
      passwordHash,
    } = getOwnerConfig();

    const [keyMatches, passwordMatches] = await Promise.all([
      bcrypt.compare(
        typeof accessKey === "string" ? accessKey : "",
        accessKeyHash
      ),
      bcrypt.compare(
        typeof password === "string" ? password : "",
        passwordHash
      ),
    ]);

    if (
      !keyMatches ||
      username !== expectedUsername ||
      !passwordMatches
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid owner credentials",
      });
    }

    const token = jwt.sign(
      {
        role: "owner",
        owner: username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "2h",
      }
    );

    return res.status(200).json({
      success: true,
      token,
      owner: {
        username,
      },
    });
  } catch (error) {
    console.error("Owner login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete owner login",
    });
  }
};

const verifyOwnerKey = async (req, res) => {
  try {
    const { accessKeyHash } = getOwnerConfig();

    const keyMatches = await bcrypt.compare(
      typeof req.body.accessKey === "string"
        ? req.body.accessKey
        : "",
      accessKeyHash
    );

    if (!keyMatches) {
      return res.status(401).json({
        success: false,
        message: "That access key is not recognized.",
      });
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Owner key verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify owner key",
    });
  }
};

const getOwnerStats = async (req, res) => {
  try {
    const [
      totalUsers,
      parents,
      children,
      families,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "parent" }),
      User.countDocuments({ role: "child" }),
      Family.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        parents,
        children,
        families,
      },
    });
  } catch (error) {
    console.error("Failed to load owner stats:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load owner statistics",
    });
  }
};

const getOwnerOverview = async (req, res) => {
  try {
    const now = new Date();

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const week = new Date(now);
    week.setDate(week.getDate() - 7);

    const month = new Date(now);
    month.setMonth(month.getMonth() - 1);

    const [
      totalUsers,
      parents,
      children,
      families,

      usersToday,
      usersWeek,
      usersMonth,

      parentsToday,
      parentsWeek,
      parentsMonth,

      childrenToday,
      childrenWeek,
      childrenMonth,

      familiesToday,
      familiesWeek,
      familiesMonth,

      onlineUsers,
      locationSharing,
      activeChats,
      snaps,
      bookings,
      sosEvents,

      recentUsers,
      openSupport,
      inProgressSupport,
      recentTickets,
      recentNews,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "parent" }),
      User.countDocuments({ role: "child" }),
      Family.countDocuments(),

      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: week } }),
      User.countDocuments({ createdAt: { $gte: month } }),

      User.countDocuments({
        role: "parent",
        createdAt: { $gte: today },
      }),
      User.countDocuments({
        role: "parent",
        createdAt: { $gte: week },
      }),
      User.countDocuments({
        role: "parent",
        createdAt: { $gte: month },
      }),

      User.countDocuments({
        role: "child",
        createdAt: { $gte: today },
      }),
      User.countDocuments({
        role: "child",
        createdAt: { $gte: week },
      }),
      User.countDocuments({
        role: "child",
        createdAt: { $gte: month },
      }),

      Family.countDocuments({
        createdAt: { $gte: today },
      }),
      Family.countDocuments({
        createdAt: { $gte: week },
      }),
      Family.countDocuments({
        createdAt: { $gte: month },
      }),

      User.countDocuments({
        lastActiveAt: {
          $gte: new Date(Date.now() - 15 * 60 * 1000),
        },
      }),

      User.countDocuments({
        isSharing: true,
      }),

      Message.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      }),

      User.countDocuments({
        snapCount: {
          $exists: true,
          $gt: 0,
        },
      }),

      Booking.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      }),

      EmergencyEvent.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      }),

      User.find()
        .select("fullName email role createdAt")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),

      SupportTicket.countDocuments({
        status: {
          $in: ["open", "reopened"],
        },
      }),

      SupportTicket.countDocuments({
        status: "in_progress",
      }),

      SupportTicket.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "ticketId email userType category subject priority status createdAt"
        )
        .lean(),

      Announcement.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "title type status publishedAt createdAt updatedAt"
        )
        .lean(),
    ]);

    return res.status(200).json({
      success: true,

      data: {
        totals: {
          totalUsers,
          parents,
          children,
          families,
        },

        growth: {
          today: {
            users: usersToday,
            parents: parentsToday,
            children: childrenToday,
            families: familiesToday,
          },

          week: {
            users: usersWeek,
            parents: parentsWeek,
            children: childrenWeek,
            families: familiesWeek,
          },

          month: {
            users: usersMonth,
            parents: parentsMonth,
            children: childrenMonth,
            families: familiesMonth,
          },
        },

        live: {
          onlineUsers,
          locationSharing,
          activeChats,
          snaps,
          bookings,
          sosEvents,
        },

        recentUsers,
        support: {
          open: openSupport,
          inProgress: inProgressSupport,
          recent: recentTickets,
        },

        news: recentNews,
      },
    });
  } catch (error) {
    console.error("Failed to load owner overview:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load owner overview",
    });
  }
};

const getOwnerUsers = async (req, res) => {
  try {
    const {
      search = "",
      role = "all",
      page = 1,
      limit = 20,
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const query = {};

    if (role !== "all") {
      query.role = role;
    }

    if (search.trim()) {
      const escaped = search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      query.$or = [
        {
          fullName: {
            $regex: escaped,
            $options: "i",
          },
        },
        {
          email: {
            $regex: escaped,
            $options: "i",
          },
        },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select(
          "fullName email phone role createdAt lastActiveAt isSharing"
        )
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean(),

      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error("Failed to load owner users:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load users",
    });
  }
};

const getOwnerAnalytics = async (req, res) => {
  try {
    const days = Math.min(
      Math.max(Number(req.query.days) || 30, 7),
      90
    );

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const [users, families] = await Promise.all([
      User.aggregate([
        {
          $match: {
            createdAt: {
              $gte: start,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]),

      Family.aggregate([
        {
          $match: {
            createdAt: {
              $gte: start,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        days,
        users,
        families,
      },
    });
  } catch (error) {
    console.error("Failed to load owner analytics:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load analytics",
    });
  }
};

const getOwnerCalendar = async (req, res) => {
  try {
    const date = String(req.query.date || "");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "A valid date is required.",
      });
    }

    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    const [
      parentsJoined,
      childrenJoined,
      familiesCreated,
      messages,
      bookings,
      sosEvents,
    ] = await Promise.all([
      User.countDocuments({
        role: "parent",
        createdAt: {
          $gte: start,
          $lte: end,
        },
      }),

      User.countDocuments({
        role: "child",
        createdAt: {
          $gte: start,
          $lte: end,
        },
      }),

      Family.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end,
        },
      }),

      Message.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end,
        },
      }),

      Booking.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end,
        },
      }),

      EmergencyEvent.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        date,
        activity: {
          parentsJoined,
          childrenJoined,
          familiesCreated,
          messages,
          snaps: 0,
          bookings,
          locationSessions: 0,
          sosEvents,
        },
      },
    });
  } catch (error) {
    console.error("Failed to load owner calendar:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load calendar activity",
    });
  }
};

const getOwnerSupport = async (req, res) => {
  try {
    const {
      status = "all",
      category = "all",
      page = 1,
      limit = 20,
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const query = {};

    if (status !== "all") {
      query.status = status;
    }

    if (category !== "all") {
      query.category = category;
    }

    const [tickets, total, open, inProgress, resolved] =
      await Promise.all([
        SupportTicket.find(query)
          .sort({ createdAt: -1 })
          .skip((pageNumber - 1) * limitNumber)
          .limit(limitNumber)
          .populate("user", "fullName email role")
          .lean(),

        SupportTicket.countDocuments(query),

        SupportTicket.countDocuments({
          status: {
            $in: ["open", "reopened"],
          },
        }),

        SupportTicket.countDocuments({
          status: "in_progress",
        }),

        SupportTicket.countDocuments({
          status: "resolved",
        }),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        tickets,
        summary: {
          open,
          inProgress,
          resolved,
        },
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error("Failed to load support tickets:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load support tickets",
    });
  }
};

const updateSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    const allowedStatuses = [
      "open",
      "in_progress",
      "resolved",
      "reopened",
    ];

    const allowedPriorities = [
      "low",
      "medium",
      "high",
      "urgent",
    ];

    if (
      status !== undefined &&
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid support ticket status.",
      });
    }

    if (
      priority !== undefined &&
      !allowedPriorities.includes(priority)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid support ticket priority.",
      });
    }

    const update = {};

    if (status !== undefined) {
      update.status = status;

      if (status === "resolved") {
        update.resolvedAt = new Date();
      } else {
        update.resolvedAt = null;
      }
    }

    if (priority !== undefined) {
      update.priority = priority;
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      update,
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error("Failed to update support ticket:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update support ticket",
    });
  }
};

const replyToSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const reply = String(req.body.reply || "").trim();

    if (!reply) {
      return res.status(400).json({
        success: false,
        message: "Reply cannot be empty.",
      });
    }

    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    await sendEmail({
      to: ticket.email,
      subject: `CareBridge Support — ${ticket.ticketId}`,
      text: reply,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
          <h2>CareBridge Support</h2>
          <p>${reply.replace(/\n/g, "<br />")}</p>
          <hr />
          <p style="color:#777;font-size:12px">
            Ticket: ${ticket.ticketId}
          </p>
        </div>
      `,
    });

    ticket.ownerReply = reply;
    ticket.repliedAt = new Date();

    if (ticket.status === "open" || ticket.status === "reopened") {
      ticket.status = "in_progress";
    }

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Reply sent successfully.",
      data: ticket,
    });
  } catch (error) {
    console.error("Failed to reply to support ticket:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send support reply",
    });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      type = "announcement",
      status = "draft",
      image = "",
    } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required.",
      });
    }

    const baseSlug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let slug = baseSlug || `announcement-${Date.now()}`;

    let suffix = 1;

    while (await Announcement.exists({ slug })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      type,
      status,
      image: image || "",
      slug,
      publishedAt:
        status === "published"
          ? new Date()
          : null,
    });

    return res.status(201).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error("Failed to create announcement:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create announcement",
    });
  }
};

const getOwnerNews = async (req, res) => {
  try {
    const news = await Announcement.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error("Failed to load owner news:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load announcements",
    });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      type,
      status,
      image,
    } = req.body;

    const update = {};

    if (title !== undefined) {
      update.title = String(title).trim();
    }

    if (content !== undefined) {
      update.content = String(content).trim();
    }

    if (type !== undefined) {
      update.type = type;
    }

    if (image !== undefined) {
      update.image = image;
    }

    if (status !== undefined) {
      update.status = status;

      if (status === "published") {
        update.publishedAt = new Date();
      }
    }

    const announcement =
      await Announcement.findByIdAndUpdate(
        id,
        update,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error("Failed to update announcement:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update announcement",
    });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Announcement.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Announcement deleted.",
    });
  } catch (error) {
    console.error("Failed to delete announcement:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete announcement",
    });
  }
};

module.exports = {
  ownerLogin,
  verifyOwnerKey,
  getOwnerStats,
  getOwnerOverview,
  getOwnerUsers,
  getOwnerAnalytics,
  getOwnerCalendar,
  getOwnerSupport,
  updateSupportTicket,
  replyToSupportTicket,
  createAnnouncement,
  getOwnerNews,
  updateAnnouncement,
  deleteAnnouncement,
};
