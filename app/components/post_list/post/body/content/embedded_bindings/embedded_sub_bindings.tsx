// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import ButtonBinding from './button_binding';
import BindingMenu from './menu_binding';

import type PostModel from '@typings/database/models/servers/post';

type Props = {
    bindings: AppBinding[];
    post: PostModel;
    theme: Theme;
}

const EmbeddedSubBindings = ({bindings, post, theme}: Props) => {
    const content: React.ReactNode[] = [];

    bindings.forEach((binding) => {
        if (!binding.app_id || !(binding.submit || binding.form?.submit || binding.form?.source || binding.bindings?.length)) {
            return;
        }

        if (binding.bindings?.length) {
            content.push(
                <BindingMenu
                    key={binding.location}
                    binding={binding}
                    post={post}
                />,
            );
            return;
        }

        content.push(
            <ButtonBinding
                key={binding.location}
                binding={binding}
                post={post}
                theme={theme}
            />,
        );
    });

    return content.length ? (<>{content}</>) : null;
};

export default EmbeddedSubBindings;
