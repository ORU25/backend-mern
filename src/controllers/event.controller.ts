import { Response } from "express";
import { IPaginationQuery, IReqUser } from "../utils/interfaces";
import response from "../utils/response";
import EventModel, { eventDAO, TEvent } from "../models/event.model";
import { FilterQuery } from "mongoose";

export default {
  async create(req: IReqUser, res: Response) {
    try {
      const payLoad = { ...req.body, createdBy: req.user?.id } as TEvent;
      await eventDAO.validate(payLoad);
      const result = await EventModel.create(payLoad);
      response.success(res, result, "Success create an event");
    } catch (error) {
      response.error(res, error, "Failed to create event");
    }
  },

  async findAll(req: IReqUser, res: Response) {
    try {
      const {
        limit = 10,
        page = 1,
        search,
      } = req.query as unknown as IPaginationQuery;
      const query: FilterQuery<TEvent> = {};
      if (search) {
        Object.assign(query, {
          ...query,
          $text: {
            $search: search,
          },
        });
      }

      const result = await EventModel.find(query)
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .exec();

      const count = await EventModel.countDocuments(query).exec();
      response.pagination(
        res,
        result,
        {
          current: page,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
        "Success get all events"
      );
    } catch (error) {
      response.error(res, error, "Failed find all events");
    }
  },

  async findOne(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      const result = await EventModel.findById(id);
      if (!result) {
        return response.notFound(res, "Event not found");
      }
      response.success(res, result, "Success get event by id");
    } catch (error) {
      response.error(res, error, "Failed find event by id");
    }
  },

  async update(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      const result = await EventModel.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      response.success(res, result, "Success update event");
    } catch (error) {
      response.error(res, error, "Failed update event");
    }
  },

  async remove(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      const result = await EventModel.findByIdAndDelete(id, {
        new: true,
      });
      response.success(res, result, "Success delete event");
    } catch (error) {
      response.error(res, error, "Failed delete event");
    }
  },

  async findOneBySlug(req: IReqUser, res: Response) {
    try {
      const { slug } = req.params;
      const result = await EventModel.findOne({ slug });
      response.success(res, result, "Success get event by slug");
    } catch (error) {
      response.error(res, error, "Failed find event by slug");
    }
  },
};
