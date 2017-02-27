'use strict';

const models = require("models"),
    HTTPStatus = require('http-status'),
    queryHelpers = require('utils/query-helpers'),
    objectValidator = require('utils/object-validator'),
    errors = require('errors'),
    <%_ if (locals.useMongo){_%>
    mongooseTypes = require('mongoose').Types,
    <%_}_%>
    <%_ if (locals.useSequelize) {_%>
    sequelize = require('utils/sequelize'),
    <%_}_%>
    _ = require('utils/lodash-ext');

/**
 * GET /api/v1/cats
 * @param req req
 * @param res res
 */

async function list(req, res) {
    //@f:off
    objectValidator.createValidator(req.query)
        .field('name')
            .optional()
            .isLength('Name search must be from 1 to 255 symbols.', {min: 1, max: 255})
        .field('bossName')
            .optional()
            .isLength('Boss name search must be from 1 to 255 symbols.', {min: 1, max: 255})
        .validate();
    //@f:on

    let pagingFilter = queryHelpers.createPaging(req.query),
        entitiesFilter = queryHelpers.createFilters(req.query, {
            name: 'startsWith',
            bossName: 'startsWith'
        }),
        sortCondition = {
            [req.query.sort || 'name']: req.query.direction || 'asc'
        };

    <%_ if (locals.useMongo) {_%>
    let [cats, totalCount] = [
        await models.Cat
            .find(entitiesFilter)
            .sort(sortCondition)
            .skip(pagingFilter.skip)
            .limit(pagingFilter.limit),
        await models.Cat
            .find(entitiesFilter).count()
    ];

    res.json({
        offset: pagingFilter.skip,
        limit: pagingFilter.limit,
        count: cats.length,
        totalCount: totalCount,
        cats: _.pickArrayExt(cats, ['id:_id', 'name', 'bossName', 'birthDate'])
    });
    <%_}_%>
    <%_ if (locals.useSequelize) {_%>
    let cats = await sequelize.transaction(async t => {
                // chain all your queries here. make sure you return them.
                return await models.Cat.findAll({
                    where: entitiesFilter,
                    transaction: t
                });
            }
        );

    res.json({
        cats: _.pickArrayExt(cats, ['name', 'bossName', 'birthDate', 'id'])
    });
    <%_}_%>
}

/**
 * GET /api/v1/cats/:id
 * @param req req
 * @param res res
 */

async function get(req, res) {
    <%_ if (locals.useMongo) {_%>
    if (!mongooseTypes.ObjectId.isValid(req.params.id)) {
        throw new errors.NotFoundError('Cat is not found.', req.params.id);
    }

    let cat = await models.Cat.findById(req.params.id);

    if (!cat) {
        throw new errors.NotFoundError('Cat is not found.', req.params.id);
    }

    res.json({
        cat: _.pickExt(cat, ['id:_id', 'name', 'bossName', 'birthDate'])
    });
    <%_}_%>
    <%_ if (locals.useSequelize) {_%>
    let cat = await sequelize.transaction(async t => {
                // chain all your queries here. make sure you return them.
                return await models.Cat.find({
                    where: {
                        id : req.params.id
                    },
                    transaction: t
                });
            }
        );

    if (!cat) {
        throw new errors.NotFoundError('Cat is not found.', req.params.id);
    }

    res.json({
        cat: _.pickExt(cat, ['name', 'bossName', 'birthDate', 'id'])
    });
    <%_}_%>
}

/**
 * POST /api/v1/cats
 * @param req req
 * @param res res
 */

async function create(req, res) {
    //@f:off
    objectValidator.createValidator(req.body)
        .field('name')
            .isLength('Name must be from 1 to 255 symbols.', {min: 1, max: 255})
        .field('bossName')
            .optional()
            .isLength('Boss Name must be from 1 to 255 symbols.', {min: 1, max: 255})
        .field('birthDate')
            .optional()
            .isDate('Invalid date.')
        .validate();
    //@f:on

    //It was made in order to not create empty fields in database
    _.removeEmptyFieldsExt(req.body, 'bossName birthDate', undefined);

    <%_ if (locals.useMongo) {_%>
    let newCat = await models.Cat.create(req.body);
    <%_}_%>
    <%_ if (locals.useSequelize) {_%>
    let newCat = await sequelize.transaction(async t => {
            // chain all your queries here. make sure you return them.
            return await models.Cat.create(req.body, {transaction: t});
        }
    );
    <%_}_%>

    res.json({
        id: newCat.id
    });
}

/**
 * PUT /api/v1/cats/:id
 * @param req req
 * @param res res
 */

async function update(req, res) {
    //@f:off
    objectValidator.createValidator(req.body, {allowUndefined: true})
        .field('name')
            .isLength('Name must be from 1 to 255 symbols.', {min: 1, max: 255})
        .field('bossName')
            .optional()
            .isLength('Boss Name must be from 1 to 255 symbols.', {min: 1, max: 255})
        .field('birthDate')
            .optional()
            .isDate('Invalid date.')
        .validate();
    //@f:on

    <%_ if (locals.useMongo) {_%>
    if (!mongooseTypes.ObjectId.isValid(req.params.id)) {
        throw new errors.NotFoundError('Cat is not found.', req.params.id);
    }

    let cat = await models.Cat.findById(req.params.id);

    if (!cat) {
        throw new errors.NotFoundError('Cat is not found.', req.params.id);
    }

    //it was made in order to delete empty fields from database
    _.removeEmptyFieldsExt(req.body, 'bossName birthDate', undefined);

    _.assign(cat, req.body);

    await cat.save();
    <%_}_%>
    <%_ if (locals.useSequelize) {_%>
    await sequelize.transaction(async t => {
            // chain all your queries here. make sure you return them.
            let cat = await models.Cat.find({
                where: {
                    id : req.params.id
                },
                transaction: t
            });

            if (!cat) {
                throw new errors.NotFoundError('Cat is not found.', req.params.id);
            }

            //it was made in order to delete empty fields from database
            _.removeEmptyFieldsExt(req.body, 'bossName birthDate', null);

            _.assign(cat, req.body);

            await cat.save({transaction: t});
        }
    );
    <%_}_%>

    res.status(HTTPStatus.NO_CONTENT).send();
}

/**
 * DELETE /api/v1/cats/:id
 * @param req req
 * @param res res
 */

async function remove(req, res) {
    <%_ if (locals.useMongo) {_%>
    if (!mongooseTypes.ObjectId.isValid(req.params.id)) {
        throw new errors.NotFoundError('Cat is not found.', req.params.id);
    }

    let cat = await models.Cat.findById(req.params.id);

    if (!cat) {
        throw new errors.NotFoundError('Cat is not found.', req.params.id);
    }

    await cat.remove();
    <%_}_%>
    <%_ if (locals.useSequelize) {_%>
    await sequelize.transaction(async t => {
            // chain all your queries here. make sure you return them.
            let cat = await models.Cat.find({
                where: {
                    id: req.params.id
                },
                transaction: t
            });

            if (!cat) {
                throw new errors.NotFoundError('Cat is not found.', req.params.id);
            }

            await cat.destroy({transaction: t});
        }
    );
    <%_}_%>

    res.status(HTTPStatus.NO_CONTENT).send();
}

module.exports = {
    list: list,
    get: get,
    create: create,
    update: update,
    remove: remove
};