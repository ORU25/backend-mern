import { Response } from "express";
import { IPaginationQuery, IReqUser } from "../utils/interfaces";
import response from "../utils/response";
import BannerModel, { bannerDAO, TypeBanner } from "../models/banner.model";
import { FilterQuery, isValidObjectId } from "mongoose";

export default {
  async create(req: IReqUser, res: Response) {
    try {
      await bannerDAO.validate(req.body);
      const result = await BannerModel.create(req.body);
      response.success(res, result, "Success create a banner");
    } catch (error) {
      response.error(res, error, "Failed to create banner");
    }
  },
  async findAll(req: IReqUser, res: Response) {
    try {
      const {
        limit = 10,
        page = 1,
        search,
      } = req.query as unknown as IPaginationQuery;

      const query: FilterQuery<TypeBanner> = {};

      if (search) {
        Object.assign(query, {
          ...query,
          $text: {
            $search: search,
          },
        });
      }

      const result = await BannerModel.find(query)
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .exec();

      const count = await BannerModel.countDocuments(query);

      response.pagination(
        res,
        result,
        {
          total: count,
          current: page,
          totalPages: Math.ceil(count / limit),
        },
        "Success get all banner"
      );
    } catch (error) {
      response.error(res, error, "Failed to find all banner");
    }
  },
  async findOne(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        return response.notFound(res, "Failed find one banner");
      }
      const result = await BannerModel.findById(id);

      if (!result) {
        return response.notFound(res, "Banner not found");
      }

      response.success(res, result, "Success find one banner");
    } catch (error) {
      response.error(res, error, "Failed to find one banner");
    }
  },
  async update(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        return response.notFound(res, "Failed update banner");
      }
      const result = await BannerModel.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      response.success(res, result, "Success update banner");
    } catch (error) {
      response.error(res, error, "Failed to update banner");
    }
  },
  async remove(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        return response.notFound(res, "Failed remove banner");
      }
      const result = await BannerModel.findByIdAndDelete(id, {
        new: true,
      });
      response.success(res, result, "Success delete banner");
    } catch (error) {
      response.error(res, error, "Failed to delete banner");
    }
  },
};
