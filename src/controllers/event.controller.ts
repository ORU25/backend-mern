import { Response } from "express";
import { IPaginationQuery, IReqUser } from "../utils/interfaces";
import response from "../utils/response";
import EventModel, { eventDTO, TypeEvent } from "../models/event.model";
import { FilterQuery, isValidObjectId } from "mongoose";
import uploader from "../utils/uploader";

export default {
  async create(req: IReqUser, res: Response) {
    try {
      const payLoad = { ...req.body, createdBy: req.user?.id } as TypeEvent;
      await eventDTO.validate(payLoad);
      const result = await EventModel.create(payLoad);
      response.success(res, result, "Success create an event");
    } catch (error) {
      response.error(res, error, "Failed to create event");
    }
  },

  async findAll(req: IReqUser, res: Response) {
    try {
      const buildQuery = (filter: any) => {
        let query: FilterQuery<TypeEvent> = {};

        if (filter.search) query.$text = { $search: filter.search };
        if (filter.category) query.category = filter.category;
        if (filter.isOnline) query.isOnline = filter.isOnline;
        if (filter.isPublish) query.isPublish = filter.isPublish;
        if (filter.isFeatured) query.isFeatured = filter.isFeatured;

        return query;
      };

      const {
        limit = 10,
        page = 1,
        search,
        category,
        isOnline,
        isPublish,
        isFeatured,
      } = req.query;

      const query = buildQuery({
        search,
        category,
        isOnline,
        isPublish,
        isFeatured,
      });

      const result = await EventModel.find(query)
        .limit(+limit)
        .skip((+page - 1) * +limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      const count = await EventModel.countDocuments(query).exec();
      response.pagination(
        res,
        result,
        {
          current: +page,
          total: count,
          totalPages: Math.ceil(count / +limit),
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
      if (!isValidObjectId(id)) {
        return response.notFound(res, "Failed find one event");
      }
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
      if (!isValidObjectId(id)) {
        return response.notFound(res, "Failed update event");
      }
      const result = await EventModel.findByIdAndUpdate(id, req.body, {
        new: true,
      });

      if (!result) return response.notFound(res, "Event not found");

      response.success(res, result, "Success update event");
    } catch (error) {
      response.error(res, error, "Failed update event");
    }
  },

  async remove(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        return response.notFound(res, "Failed remove event");
      }
      const result = await EventModel.findByIdAndDelete(id, {
        new: true,
      });

      if (!result) return response.notFound(res, "Event not found");

      await uploader.remove(result.banner);

      response.success(res, result, "Success delete event");
    } catch (error) {
      response.error(res, error, "Failed delete event");
    }
  },

  async findOneBySlug(req: IReqUser, res: Response) {
    try {
      const { slug } = req.params;
      const result = await EventModel.findOne({ slug });

      if (!result) return response.notFound(res, "Event not found");

      response.success(res, result, "Success get event by slug");
    } catch (error) {
      response.error(res, error, "Failed find event by slug");
    }
  },
};
