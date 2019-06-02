import $ from 'cafy';
import define from '../../define';
import { types, bool } from '../../../../misc/schema';
import { Pages, Files, Commits } from '../../../../models';
import { Page } from '../../../../models/entities/page';
import { ApiError } from '../../error';
import { Commit } from '../../../../models/entities/commit';
import { parseMd } from '../../common/parse-md';

export const meta = {
	kind: 'write:pages',

	params: {
		title: {
			validator: $.str,
		},

		subTitle: {
			validator: $.str,
		},

		name: {
			validator: $.str,
		},

		content: {
			validator: $.str,
		},

		eyeCatchingImageId: {
			validator: $.optional.nullable.num,
		},
	},

	res: {
		type: types.object,
		optional: bool.false, nullable: bool.false,
		ref: 'Page',
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'b9a357b9-8014-42b8-9fb8-40043b9f0c91'
		},
	}
};

export default define(meta, async (ps, user) => {
	let eyeCatchingImage = null;
	if (ps.eyeCatchingImageId != null) {
		eyeCatchingImage = await Files.findOne(ps.eyeCatchingImageId);

		if (eyeCatchingImage == null) {
			throw new ApiError(meta.errors.noSuchFile);
		}
	}

	const ast = parseMd(ps.content);

	// todo: transaction

	const page = await Pages.save(new Page({
		createdAt: new Date(),
		updatedAt: new Date(),
		title: ps.title,
		subTitle: ps.subTitle,
		name: ps.name,
		content: ps.content,
		ast: ast,
		eyeCatchingImageId: eyeCatchingImage ? eyeCatchingImage.id : null,
	}));

	await Commits.save(new Commit({
		createdAt: new Date(),
		userId: user ? user.id : null,
		type: 'page',
		message: 'Initial commit',
		content: {
			title: page.title,
			subTitle: page.subTitle,
			name: page.name,
			content: page.content,
			eyeCatchingImageId: page.eyeCatchingImageId,
		},
	}));

	return await Pages.pack(page, true);
});
