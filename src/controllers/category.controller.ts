import { Response } from "express";
import { IPaginationQuery, IReqUser } from "../utils/interfaces";
import CategoryModel, { categoryDAO } from "../models/category.model";
import response from "../utils/response";
import { isValidObjectId } from "mongoose";

export default {
  async create(req: IReqUser, res: Response) {
    try {
      await categoryDAO.validate(req.body);
      const result = await CategoryModel.create(req.body);
      response.success(res, result, "success create category");
    } catch (error) {
      response.error(res, error, "Failed to create category");
    }
  },

  async findAll(req: IReqUser, res: Response) {
    const {
      page = 1,
      limit = 10,
      search,
    } = req.query as unknown as IPaginationQuery;
    try {
      const query = {};
      if (search) {
        Object.assign(query, {
          $or: [
            {
              name: { $regex: search, $options: "i" },
            },
            {
              description: { $regex: search, $options: "i" },
            },
          ],
        });
      }
      const result = await CategoryModel.find(query)
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .exec();

      const count = await CategoryModel.countDocuments(query);

      response.pagination(
        res,
        result,
        {
          total: count,
          totalPages: Math.ceil(count / limit),
          current: page,
        },
        "success findAll categories"
      );
    } catch (error) {
      response.error(res, error, "Failed to fetch categories");
    }
  },

  async findOne(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        return response.notFound(res, "Failed find one category");
      }
      const result = await CategoryModel.findById(id);
      if (!result) {
        return response.notFound(res, "Category not found");
      }
      response.success(res, result, "success findOne category");
    } catch (error) {
      response.error(res, error, "Failed to fetch category");
    }
  },
  async update(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
       if (!isValidObjectId(id)) {
         return response.notFound(res, "Failed update category");
       }
      const result = await CategoryModel.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      response.success(res, result, "success findOne category");
    } catch (error) {
      response.error(res, error, "Failed to update category");
    }
  },
  async remove(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
       if (!isValidObjectId(id)) {
         return response.notFound(res, "Failed remove category");
       }
      const result = await CategoryModel.findByIdAndDelete(id, {
        new: true,
      });
      response.success(res, result, "success findOne category");
    } catch (error) {
      response.error(res, error, "Failed to delete category");
    }
  },
};
