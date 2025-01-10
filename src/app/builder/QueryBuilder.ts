import { FilterQuery, Query } from 'mongoose';

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  search(searchableFields: string[]) {
    const searchTerm = this?.query?.searchTerm;
    if (searchTerm) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map(
          field =>
            ({
              [field]: { $regex: searchTerm, $options: 'i' },
            }) as FilterQuery<T>,
        ),
      });
    }

    return this;
  }

  filter() {
    const queryObj = { ...this.query }; // copy

    // Filtering
    const excludeFields = [
      'searchTerm',
      'sort',
      'limit',
      'page',
      'fields',
      'minPrice',
      'maxPrice',
    ];

    excludeFields.forEach(el => delete queryObj[el]);

    this.modelQuery = this.modelQuery.find(queryObj as FilterQuery<T>);

    return this;
  }

  sort() {
    const sort =
      (this?.query?.sort as string)?.split(',')?.join(' ') || '-createdAt';
    this.modelQuery = this.modelQuery.sort(sort as string);

    return this;
  }

  paginate() {
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);

    return this;
  }

  fields() {
    const fields =
      (this?.query?.fields as string)?.split(',')?.join(' ') || '-__v';

    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  priceRange() {
    const minPrice = this?.query?.minPrice;
    const maxPrice = this?.query?.maxPrice;
    const priceFilter: Record<string, unknown> = {};

    if (minPrice !== undefined) {
      priceFilter.$gte = minPrice;
    }

    if (maxPrice !== undefined) {
      priceFilter.$lte = maxPrice;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      this.modelQuery = this.modelQuery.find({
        pricePerHour: priceFilter,
      } as FilterQuery<T>);
    }

    return this;
  }

  filterByPriceRange(priceField: string) {
    const minPrice = this?.query?.minPrice;
    const maxPrice = this?.query?.maxPrice;
    const priceFilter: Record<string, unknown> = {};

    if (minPrice !== undefined) {
      priceFilter.$gte = minPrice;
    }

    if (maxPrice !== undefined) {
      priceFilter.$lte = maxPrice;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      this.modelQuery = this.modelQuery.find({
        [`pricing.${priceField}`]: priceFilter,
      } as FilterQuery<T>);
    }

    return this;
  }

  filterBySpecifications() {
    const { transmission, fuelType, seatingCapacity, minMileage, maxMileage } =
      this.query;

    if (transmission) {
      this.modelQuery = this.modelQuery.find({
        'specifications.transmission': transmission,
      } as FilterQuery<T>);
    }

    if (fuelType) {
      this.modelQuery = this.modelQuery.find({
        'specifications.fuelType': fuelType,
      } as FilterQuery<T>);
    }

    if (seatingCapacity) {
      this.modelQuery = this.modelQuery.find({
        'specifications.seatingCapacity': seatingCapacity,
      } as FilterQuery<T>);
    }

    if (minMileage || maxMileage) {
      const mileageFilter: Record<string, unknown> = {};
      if (minMileage) mileageFilter.$gte = minMileage;
      if (maxMileage) mileageFilter.$lte = maxMileage;

      this.modelQuery = this.modelQuery.find({
        'specifications.mileage': mileageFilter,
      } as FilterQuery<T>);
    }

    return this;
  }

  filterByStatus() {
    const { status } = this.query;
    if (status) {
      this.modelQuery = this.modelQuery.find({
        status,
      } as FilterQuery<T>);
    }
    return this;
  }

  filterByRating() {
    const { minRating } = this.query;
    if (minRating) {
      this.modelQuery = this.modelQuery.find({
        'ratingStats.averageRating': { $gte: Number(minRating) },
      } as FilterQuery<T>);
    }
    return this;
  }

  async countTotal() {
    const totalQueries = this.modelQuery.getFilter();
    const total = await this.modelQuery.model.countDocuments(totalQueries);
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}

export default QueryBuilder;
