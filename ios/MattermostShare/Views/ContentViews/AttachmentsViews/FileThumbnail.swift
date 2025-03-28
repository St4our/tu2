//
//  FileThumbnail.swift
//  MattermostShare
//
// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.//

import SwiftUI

struct FileThumbnail: View {
  var attachment: AttachmentModel
  var hasError: Bool
  
  var body: some View {
    VStack {
      attachment.icon()
      Text(attachment.fileName)
        .foregroundColor(Color.theme.centerChannelColor)
        .lineLimit(1)
        .font(Font.custom("OpenSans-SemiBold", size: 10))
        .padding(.horizontal, 4)
      Text("\(attachment.fileUrl.pathExtension.uppercased()) \(attachment.formattedFileSize)")
        .foregroundColor(Color.theme.centerChannelColor.opacity(0.64))
        .lineLimit(1)
        .font(Font.custom("OpenSans", size: 12))
    }
    .background(
      RoundedRectangle(cornerRadius: 4)
        .stroke(
          hasError ? Color.theme.errorTextColor : Color.theme.centerChannelColor.opacity(0.16),
          lineWidth: 1
        )
        .shadow(color: Color(red: 0, green: 0, blue: 0, opacity: 0.08), radius: 3, x: 0, y: 2)
        .frame(width: 104, height: 104)
    )
    .frame(width: 104, height: 104)
  }
}
